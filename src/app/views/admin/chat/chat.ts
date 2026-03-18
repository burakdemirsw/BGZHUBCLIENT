import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state, group, animateChild } from '@angular/animations';
import { CONVERSATION_TYPES, ConversationType, DEFAULT_CONVERSATION_TYPE, isValidConversationType } from '@/app/core/models/conversation/conversation-type.constants';
import { ConversationHeader, ChatMessage, ConversationListResponse } from '@/app/core/models/conversation/conversation.models';
import { ConversationsService } from '@/app/core/services/conversations.service';

interface SidebarSection {
    title: string;
    expanded: boolean;
    items: { label: string; value: string }[];
}

@Component({
    selector: 'app-chat-page',
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './chat.html',
    styleUrls: ['./chat.scss'],
    animations: [
        // Sağ sidebar slide animasyonu
        trigger('detailsSlide', [
            transition(':enter', [
                style({ width: 0, minWidth: 0, opacity: 0, overflow: 'hidden' }),
                animate('250ms cubic-bezier(0.4, 0, 0.2, 1)', style({ width: '*', minWidth: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate('200ms cubic-bezier(0.4, 0, 0.2, 1)', style({ width: 0, minWidth: 0, opacity: 0 }))
            ])
        ]),
        // Mesaj baloncukları fade-slide
        trigger('messageAnim', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(12px)' }),
                animate('300ms 50ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
            ])
        ]),
        // Chat paneli fade
        trigger('chatPanelAnim', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('250ms ease-out', style({ opacity: 1 }))
            ])
        ]),
        // Search bar slide-down
        trigger('slideDown', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate('150ms ease-in', style({ height: 0, opacity: 0 }))
            ])
        ]),
        // Teammate listesi
        trigger('expandCollapse', [
            transition(':enter', [
                style({ height: 0, opacity: 0, overflow: 'hidden' }),
                animate('200ms ease-out', style({ height: '*', opacity: 1 }))
            ]),
            transition(':leave', [
                style({ overflow: 'hidden' }),
                animate('150ms ease-in', style({ height: 0, opacity: 0 }))
            ])
        ]),
    ],
})
export class ChatPage implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild('chatBody') chatBody!: ElementRef;
    private contentPageEl: Element | null = null;

    // Route params
    activeConversationType: string = DEFAULT_CONVERSATION_TYPE;
    activeConversationId: string | null = null;
    conversationTypes: ConversationType[] = CONVERSATION_TYPES;

    // Left sidebar
    sidebarItems = CONVERSATION_TYPES.map(ct => ({
        icon: ct.icon,
        label: ct.label,
        badge: ct.key === 'messages' ? '1' : '',
        active: ct.key === DEFAULT_CONVERSATION_TYPE,
        section: 'main',
        path: ct.path,
    }));

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private renderer: Renderer2,
        private conversationsService: ConversationsService
    ) {}

    teammates = [
        { name: 'Ahmet Yılmaz', initials: 'AY', avatarColor: '#6366F1', online: true },
        { name: 'Elif Demir', initials: 'ED', avatarColor: '#10B981', online: true },
    ];

    showTeammates = true;

    // Conversations
    conversations: ConversationHeader[] = [];
    selectedConversation: ConversationHeader | null = null;
    totalConversationCount = 0;
    conversationFilter = '12 Open';
    conversationSort = 'Newest';

    // Chat
    messages: ChatMessage[] = [];
    newMessage = '';
    replyType: 'reply' | 'note' = 'reply';

    // Right sidebar
    detailSections: SidebarSection[] = [];
    showDetails = true;

    // Search
    searchOpen = false;
    searchText = '';

    private shouldScroll = false;

    ngOnInit(): void {
        // content-page scroll'u engelle
        this.contentPageEl = document.querySelector('.content-page');
        if (this.contentPageEl) {
            this.renderer.addClass(this.contentPageEl, 'chat-page-active');
        }

        this.route.params.subscribe(async params => {
            const type = params['conversationType'] || DEFAULT_CONVERSATION_TYPE;

            // Geçersiz conversationType ise default'a yönlendir
            if (!isValidConversationType(type)) {
                this.router.navigate(['/chat', DEFAULT_CONVERSATION_TYPE]);
                return;
            }

            // Sadece farklı bir tipe geçişte sağ sidebar'ı kapat
            if (this.activeConversationType !== type && this.activeConversationType !== DEFAULT_CONVERSATION_TYPE) {
                this.showDetails = false;
            }

            this.activeConversationType = type;

            // Sidebar aktif durumunu güncelle
            this.sidebarItems.forEach(item => item.active = item.path === type);

            // API'den sidebar badge sayılarını çek
            await this.loadSidebar();

            // API'den sohbet listesini çek
            await this.loadConversations();

            // Query param'dan conversationId oku
            const convId = this.route.snapshot.queryParams['conversationId'] || null;
            if (convId) {
                const found = this.conversations.find(c => c.id === convId);
                if (found) {
                    this.selectConversation(found, false);
                    return;
                }
            }

            // conversationId yoksa veya bulunamadıysa ilk sohbeti seç
            if (this.conversations.length > 0) {
                this.selectConversation(this.conversations[0], true);
            }
        });
    }

    ngOnDestroy(): void {
        if (this.contentPageEl) {
            this.renderer.removeClass(this.contentPageEl, 'chat-page-active');
        }
    }

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.scrollToBottom();
            this.shouldScroll = false;
        }
    }

    async loadSidebar(): Promise<void> {
        try {
            const response = await this.conversationsService.getSidebar();
            const data = this.extractArray(response);
            data.forEach((item: any) => {
                const sidebar = this.sidebarItems.find(s => s.path === item.type);
                if (sidebar) {
                    sidebar.badge = item.count > 0 ? String(item.count) : '';
                }
            });
        } catch (err) {
            console.error('Sidebar yüklenemedi:', err);
        }
    }

    async loadConversations(): Promise<void> {
        try {
            const response = await this.conversationsService.getList(this.activeConversationType);
            const body = response?.data ?? response;
            if (body?.conversations) {
                this.conversations = Array.isArray(body.conversations)
                    ? body.conversations
                    : (body.conversations?.$values ?? []);
                this.totalConversationCount = body.totalCount ?? this.conversations.length;
            } else {
                this.conversations = this.extractArray(response);
                this.totalConversationCount = this.conversations.length;
            }
        } catch (err) {
            console.error('Sohbet listesi yüklenemedi:', err);
            this.conversations = [];
            this.totalConversationCount = 0;
        }
    }

    selectConversation(conv: ConversationHeader, navigate: boolean = true): void {
        this.selectedConversation = conv;
        this.activeConversationId = conv.id;
        this.loadMessages(conv.id);

        // URL'yi güncelle
        if (navigate) {
            this.router.navigate(
                ['/chat', this.activeConversationType],
                { queryParams: { conversationId: conv.id }, replaceUrl: true }
            );
        }
    }

    async loadMessages(conversationId: string): Promise<void> {
        try {
            const response = await this.conversationsService.getMessages(conversationId);
            this.messages = this.extractArray(response);
            this.shouldScroll = true;
        } catch (err) {
            console.error('Mesajlar yüklenemedi:', err);
            this.messages = [];
        }
    }

    sendMessage(): void {
        if (!this.newMessage.trim() || !this.selectedConversation) return;
        const msg: ChatMessage = {
            id: 'new_' + Date.now(),
            conversationId: this.selectedConversation.id,
            source: 'agent',
            text: this.newMessage,
            createdDate: new Date().toISOString(),
        };
        this.messages.push(msg);
        this.newMessage = '';
        this.shouldScroll = true;
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data?.items) return response.data.items;
        if (response?.data?.conversations) return response.data.conversations;
        if (response?.data?.messages) return response.data.messages;
        if (response?.data?.$values) return response.data.$values;
        if (response?.data && Array.isArray(response.data)) return response.data;
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    toggleSection(section: SidebarSection): void {
        section.expanded = !section.expanded;
    }

    scrollToBottom(): void {
        try {
            if (this.chatBody) {
                this.chatBody.nativeElement.scrollTop = this.chatBody.nativeElement.scrollHeight;
            }
        } catch (err) {}
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    }

    getConversationCount(): number {
        return this.totalConversationCount;
    }

    toggleSidebarSection(section: string): void {
        if (section === 'teammates') this.showTeammates = !this.showTeammates;
    }

    setActiveItem(item: any): void {
        this.sidebarItems.forEach(i => (i.active = false));
        item.active = true;
        this.router.navigate(['/chat', item.path]);
    }
}

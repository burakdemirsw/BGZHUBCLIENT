import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatHistoryEntry, SidebarComponent } from '../sidebar/sidebar';
import { ConversationsService } from '@/app/core/services/conversations.service';
import { AiMessagesService } from '@/app/core/services/ai-messages.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiMessageResponse } from '@/app/core/models/ai-assistant/ai-message.models';
import { MessagesService } from '@/app/core/services/messages.service';
import {
    ConversationHeader,
    ConversationMessagesResponse,
    CreateTestConversationRequest,
} from '@/app/core/models/conversation/conversation.models';

interface UiChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

interface ConversationApiMessage {
    id?: string;
    source?: string | null;
    text?: string | null;
    messageText?: string | null;
    messageContent?: string | null;
    createdDate?: string | null;
}

interface CreateTestConversationResponse {
    conversationId?: string;
}

@Component({
    selector: 'app-nebim-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './nebim-ai-chat.html',
    styleUrl: './nebim-ai-chat.scss'
})
export class NebimAiChatPage implements OnInit, AfterViewChecked {
    @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;
    @ViewChild('textArea') textArea?: ElementRef<HTMLTextAreaElement>;
    @ViewChild(SidebarComponent) sidebar?: SidebarComponent;

    messages: UiChatMessage[] = [];
    sidebarChats: ChatHistoryEntry[] = [];
    input = '';
    isSending = false;
    isLoadingThread = false;
    sidebarCollapsed = false;
    sidebarMobileOpen = false;

    activeConversationId: string | null = null;
    errorMessage = '';

    private shouldScroll = false;

    readonly suggestions: { title: string; subtitle: string }[] = [
        { title: 'Bir konu özetle', subtitle: 'Uzun bir metni kısaca özetlemeni isteyebilirsin.' },
        { title: 'Fikir üret', subtitle: 'Yeni bir kampanya veya içerik için önerilerde bulun.' },
        { title: 'Kod yaz', subtitle: 'Küçük bir fonksiyon veya bileşen taslağı oluştur.' },
        { title: 'Metin düzenle', subtitle: 'Yazımı sadeleştir, tonu profesyonelleştir.' }
    ];

    constructor(
        private conversationsService: ConversationsService,
        private aiMessagesService: AiMessagesService,
        private messagesService: MessagesService,
        private authState: AuthStateService,
        private router: Router,
        private route: ActivatedRoute,
    ) {}
   
    async ngOnInit(): Promise<void> {
        await Promise.all([this.loadSidebar(), this.loadConversationList()]);

        const routeConversationId = this.route.snapshot.paramMap.get('conversationId');
        if (routeConversationId) {
            this.activeConversationId = routeConversationId;
            await this.loadThread(routeConversationId);
        }
    }   

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.shouldScroll = false;
            this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    useSuggestion(text: string): void {
        this.input = text;
        setTimeout(() => {
            this.textArea?.nativeElement.focus();
            this.autoResize();
        }, 0);
    }

    onEnter(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.shiftKey) return;
        keyboardEvent.preventDefault();
        this.send();
    }

    autoResize(): void {
        const el = this.textArea?.nativeElement;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    send(): void {
        void this.sendAsync();
    }

    private async sendAsync(): Promise<void> {
        const content = this.input.trim();
        if (!content || this.isSending) return;

        // 1) Aktif sohbet yoksa yeni sohbet oluştur
        if (!this.activeConversationId) {
            const created = await this.ensureConversation();
            if (!created) return;
            this.activeConversationId = created;
            await this.navigateToConversation(created);
        }

        const conversationId = this.activeConversationId!;

        // 2) UI'a kullanıcı mesajını optimistic ekle
        this.messages = [
            ...this.messages,
            { id: this.uid(), role: 'user', content, createdAt: new Date() }
        ];
        this.input = '';
        this.isSending = true;
        this.errorMessage = '';
        this.shouldScroll = true;
        setTimeout(() => this.autoResize(), 0);

        try {
            // 3) User mesajını /api/Messages ile kaydet
            await this.messagesService.sendMessage({
                conversationId,
                messageContent: content,
                source: 'user',
                createdUserId: this.authState.profile?.userId ?? undefined,
            });

            // 4) Sohbet listesini yenile
            await this.loadConversationList();

            // 5) Asistan cevabını /api/Ai/messages/by-conversation ile çek
            const hasAssistantReply = await this.tryAppendAssistantReply(conversationId);
            if (!hasAssistantReply) {
                this.appendFallbackAssistant();
            }
        } catch (err) {
            console.error('[NebimAiChat] Mesaj gönderilemedi:', err);
            this.errorMessage = 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
        } finally {
            this.isSending = false;
            this.shouldScroll = true;
        }
    }

    private async tryAppendAssistantReply(conversationId: string): Promise<boolean> {
        try {
            await this.delay(450);
            const res = await this.aiMessagesService.getByConversation(conversationId);
            const list = this.extractArray<AiMessageResponse>(res.data)
                .filter(m => !!m.messageText && m.role === 'assistant')
                .sort((a, b) => {
                    const ta = new Date(a.createdDate).getTime();
                    const tb = new Date(b.createdDate).getTime();
                    return tb - ta;
                });

            const candidate = list.find(m => !this.messages.some(existing => existing.id === m.id));
            if (!candidate) return false;

            this.messages = [
                ...this.messages,
                {
                    id: candidate.id,
                    role: 'assistant',
                    content: candidate.messageText ?? '',
                    createdAt: candidate.createdDate ? new Date(candidate.createdDate) : new Date(),
                },
            ];
            return true;
        } catch (err) {
            console.warn('[NebimAiChat] AI mesajı okunamadı:', err);
            return false;
        }
    }

    private appendFallbackAssistant(): void {
        this.messages = [
            ...this.messages,
            { id: this.uid(), role: 'assistant', content: 'test mesajı', createdAt: new Date() },
        ];
    }

    private async ensureConversation(): Promise<string | null> {
        const companyId = this.authState.profile?.companyId;
        if (!companyId) {
            this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
            return null;
        }
        try {
            const payload: CreateTestConversationRequest = {
                companyId,
                firstName: this.authState.profile?.name || 'Test',
                lastName: this.authState.profile?.surname || 'User',
                userIntSmaId: null,
            };
            const res = await this.conversationsService.createTestConversation(payload);
            const id = this.extractConversationId(res.data);
            if (id) await this.loadConversationList();
            return id;
        } catch (err) {
            console.error('[NebimAiChat] Sohbet oluşturulamadı:', err);
            this.errorMessage = 'Yeni sohbet oluşturulamadı.';
            return null;
        }
    }

    private extractConversationId(data: string | CreateTestConversationResponse | null): string | null {
        if (typeof data === 'string' && data.trim().length > 0) {
            return data;
        }

        if (data && typeof data === 'object' && typeof data.conversationId === 'string' && data.conversationId.trim().length > 0) {
            return data.conversationId;
        }

        return null;
    }

    private async loadSidebar(): Promise<void> {
        try {
            await this.conversationsService.getSidebar();
        } catch (err) {
            console.warn('[NebimAiChat] Sidebar yüklenemedi:', err);
        }
    }

    private async loadConversationList(): Promise<void> {
        try {
            const res = await this.conversationsService.getList('messages', 1, 50);
            const conversations = this.extractConversationHeaders(res.data);
            this.sidebarChats = conversations.map((conversation, index) => ({
                id: conversation.id,
                label: this.toConversationLabel(conversation, index),
            }));
        } catch (err) {
            console.warn('[NebimAiChat] Sohbet listesi yüklenemedi:', err);
            this.sidebarChats = [];
        }
    }

    private async loadThread(conversationId: string): Promise<void> {
        this.isLoadingThread = true;
        this.errorMessage = '';
        try {
            const res = await this.conversationsService.getMessages(conversationId);
            const list = this.extractConversationMessages(res.data);
            this.messages = list
                .filter(m => !!this.resolveMessageText(m))
                .map<UiChatMessage>(m => ({
                    id: m.id ?? this.uid(),
                    role: this.resolveRole(m),
                    content: this.resolveMessageText(m),
                    createdAt: m.createdDate ? new Date(m.createdDate) : new Date(),
                }));
            this.shouldScroll = true;
        } catch (err) {
            console.error('[NebimAiChat] Thread yüklenemedi:', err);
            this.errorMessage = 'Sohbet mesajları yüklenemedi.';
            this.messages = [];
        } finally {
            this.isLoadingThread = false;
        }
    }

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response as T[];
        if (!response || typeof response !== 'object') return [];

        const record = response as Record<string, unknown>;
        if (Array.isArray(record['$values'])) return record['$values'] as T[];
        if (Array.isArray(record['items'])) return record['items'] as T[];

        const data = record['data'];
        if (Array.isArray(data)) return data as T[];
        if (data && typeof data === 'object') return [data as T];

        const result = record['result'];
        if (Array.isArray(result)) return result as T[];
        if (result && typeof result === 'object') return [result as T];

        return [];
    }

    private extractConversationHeaders(response: unknown): ConversationHeader[] {
        if (!response || typeof response !== 'object') return [];
        const record = response as Record<string, unknown>;
        return this.extractArray<ConversationHeader>(record['conversations']);
    }

    private extractConversationMessages(response: ConversationMessagesResponse | null): ConversationApiMessage[] {
        if (!response || typeof response !== 'object') return [];
        return this.extractArray<ConversationApiMessage>(response.messages);
    }

    private resolveRole(message: ConversationApiMessage): 'user' | 'assistant' {
        const source = (message.source ?? '').toLowerCase();
        return source.includes('assistant') || source.includes('ai') ? 'assistant' : 'user';
    }

    private resolveMessageText(message: ConversationApiMessage): string {
        return message.text ?? message.messageText ?? message.messageContent ?? '';
    }

    private toConversationLabel(conversation: ConversationHeader, index: number): string {
        if (conversation.customerName?.trim()) return conversation.customerName.trim();
        if (conversation.lastMessage?.trim()) return conversation.lastMessage.trim();
        return `Sohbet ${index + 1}`;
    }

    newChat(): void {
        this.messages = [];
        this.input = '';
        this.activeConversationId = null;
        this.errorMessage = '';
        this.sidebarMobileOpen = false;
        setTimeout(() => this.textArea?.nativeElement.focus(), 0);
    }

    toggleSidebar(): void {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    /** Header hamburger: mobil'de drawer, desktop'ta collapse toggle */
    onHamburgerClick(): void {
        if (window.matchMedia('(max-width: 768px)').matches) {
            this.sidebarMobileOpen = true;
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
        }
    }

    openMobileSidebar(): void {
        this.sidebarMobileOpen = true;
    }

    closeMobileSidebar(): void {
        this.sidebarMobileOpen = false;
    }  

    async onSelectChat(conversationId: string): Promise<void> {
        this.sidebarMobileOpen = false;
        this.activeConversationId = conversationId;
        await this.navigateToConversation(conversationId);
        await this.loadThread(conversationId);
    }

    private async navigateToConversation(conversationId: string): Promise<void> {
        await this.router.navigate(['/c', conversationId]);
    }

    private uid(): string {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

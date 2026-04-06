import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, Renderer2, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { trigger, transition, style, animate, query, stagger, state, group, animateChild } from '@angular/animations';
import { CONVERSATION_TYPES, ConversationType, DEFAULT_CONVERSATION_TYPE, isValidConversationType } from '@/app/core/models/conversation/conversation-type.constants';
import { ConversationHeader, ChatMessage, ConversationListResponse, ConversationMessagesResponse, ConversationCustomerDetail, ConversationOrderSummary, ConversationTagItem, ConversationNoteItem } from '@/app/core/models/conversation/conversation.models';
import { ConversationsService } from '@/app/core/services/conversations.service';
import { ShortcutsService } from '@/app/core/services/shortcuts.service';
import { Shortcut } from '@/app/core/models/shortcut/shortcut.models';
import { TagsService } from '@/app/core/services/tags.service';
import { ConversationTagsService } from '@/app/core/services/conversation-tags.service';
import { ConversationNotesService } from '@/app/core/services/conversation-notes.service';
import { SegmentsService } from '@/app/core/services/segments.service';
import { ConversationSegmentsService } from '@/app/core/services/conversation-segments.service';
import { Tag } from '@/app/core/models/tag/tag.models';
import { Segment } from '@/app/core/models/customer/segment.models';
import { PresenceService, OnlineUser } from '@/app/core/services/presence.service';
import { ChatSignalRService, TypingEvent, NewConversationEvent } from '@/app/core/services/chat-signalr.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { MessagesService } from '@/app/core/services/messages.service';
import { Subscription } from 'rxjs';

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
        private conversationsService: ConversationsService,
        private shortcutsService: ShortcutsService,
        private tagsService: TagsService,
        private conversationTagsService: ConversationTagsService,
        private conversationNotesService: ConversationNotesService,
        private segmentsService: SegmentsService,
        private conversationSegmentsService: ConversationSegmentsService,
        private presenceService: PresenceService,
        private chatSignalR: ChatSignalRService,
        private authStateService: AuthStateService,
        private messagesService: MessagesService
    ) {}

    teammates: OnlineUser[] = [];
    showTeammates = true;
    hubConnectionState: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
    private presenceSub!: Subscription;
    private connectionStateSub!: Subscription;

    // Chat SignalR
    chatHubState: 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
    typingUser: string | null = null;
    private typingTimeout: any = null;
    private chatHubSubs: Subscription[] = [];

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

    // Customer detail & orders (from ConversationMessagesResponse)
    customerDetail: ConversationCustomerDetail | null = null;
    conversationOrders: ConversationOrderSummary[] = [];

    // Right sidebar
    detailSections: SidebarSection[] = [];
    showDetails = true;
    detailsActiveTab: 'details' | 'copilot' = 'details';

    // Tags
    allTags: Tag[] = [];
    conversationTags: any[] = [];
    showTagDropdown = false;
    tagSearchText = '';

    // Notes
    conversationNotes: any[] = [];
    showNoteForm = false;
    newNoteTitle = '';
    newNoteContent = '';

    // Segments
    allSegments: Segment[] = [];
    conversationSegments: any[] = [];
    showSegmentDropdown = false;
    segmentSearchText = '';

    // Search
    searchOpen = false;
    searchText = '';

    // Context menu
    contextMenuConv: ConversationHeader | null = null;
    contextMenuX = 0;
    contextMenuY = 0;

    // Shortcut system
    shortcuts: Shortcut[] = [];
    filteredShortcuts: Shortcut[] = [];
    showShortcutPopup = false;
    shortcutSearchText = '';
    selectedShortcutIndex = 0;

    private shouldScroll = false;

    // File upload
    @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild('imageInput') imageInput!: ElementRef<HTMLInputElement>;
    pendingFile: { file: File; name: string; type: string; size: number; preview?: string } | null = null;

    ngOnInit(): void {
        // content-page scroll'u engelle
        this.contentPageEl = document.querySelector('.content-page');
        if (this.contentPageEl) {
            this.renderer.addClass(this.contentPageEl, 'chat-page-active');
        }

        // Kısayolları yükle
        this.loadShortcuts();
        this.loadAllTags();
        this.loadAllSegments();

        // Presence Hub bağlantısı
        this.presenceService.start();
        this.presenceSub = this.presenceService.onlineUsers$.subscribe(users => {
            this.teammates = users;
        });
        this.connectionStateSub = this.presenceService.connectionState$.subscribe(state => {
            this.hubConnectionState = state;
        });

        // Chat Hub bağlantısı
        this.chatSignalR.start();
        this.chatHubSubs.push(
            this.chatSignalR.connectionState$.subscribe(s => this.chatHubState = s),
            this.chatSignalR.newMessage$.subscribe(msg => this.onNewMessage(msg)),
            this.chatSignalR.conversationUpdated$.subscribe(evt => this.onConversationUpdated(evt)),
            this.chatSignalR.userTyping$.subscribe(evt => this.onUserTyping(evt)),
            this.chatSignalR.messageRead$.subscribe(evt => this.onMessageRead(evt)),
            this.chatSignalR.newConversation$.subscribe(evt => this.onNewConversation(evt))
        );

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
        this.presenceService.stop();
        this.presenceSub?.unsubscribe();
        this.connectionStateSub?.unsubscribe();

        this.chatSignalR.stop();
        this.chatHubSubs.forEach(s => s.unsubscribe());
    }

    get onlineTeammateCount(): number {
        return this.teammates.filter(t => t.online).length;
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
            const data = this.extractArray(response?.data);
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
            const body = response?.data;
            if (body?.conversations) {
                const convRaw = body.conversations as any;
                this.conversations = Array.isArray(convRaw)
                    ? convRaw
                    : (convRaw?.$values ?? []);
                this.totalConversationCount = body.totalCount ?? this.conversations.length;
            } else {
                this.conversations = this.extractArray(body);
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
        this.typingUser = null;
        this.chatSignalR.joinConversation(conv.id);
        this.loadMessages(conv.id);
        this.loadConversationSegments(conv.id);

        // URL'yi güncelle
        if (navigate) {
            this.router.navigate(
                ['/chat', this.activeConversationType],
                { queryParams: { conversationId: conv.id }, replaceUrl: true }
            );
        }
    }

    isRefreshing = false;

    async refreshConversationDetails(): Promise<void> {
        if (!this.selectedConversation || this.isRefreshing) return;
        this.isRefreshing = true;
        const id = this.selectedConversation.id;
        try {
            await Promise.all([
                this.loadMessages(id),
                this.loadConversationSegments(id),
            ]);
        } finally {
            this.isRefreshing = false;
        }
    }

    async loadMessages(conversationId: string): Promise<void> {
        try {
            const response = await this.conversationsService.getMessages(conversationId);
            const body = response?.data;

            // Messages
            if (body?.messages) {
                this.messages = Array.isArray(body.messages)
                    ? body.messages
                    : (body.messages as any)?.$values ?? [];
            } else {
                this.messages = this.extractArray(body);
            }

            // Tags
            this.conversationTags = body?.tags
                ? (Array.isArray(body.tags) ? body.tags : (body.tags as any)?.$values ?? [])
                : [];

            // Notes
            this.conversationNotes = body?.notes
                ? (Array.isArray(body.notes) ? body.notes : (body.notes as any)?.$values ?? [])
                : [];

            // Orders
            this.conversationOrders = body?.orders
                ? (Array.isArray(body.orders) ? body.orders : (body.orders as any)?.$values ?? [])
                : [];

            // Customer detail
            this.customerDetail = body?.customerDetail ?? null;

            this.shouldScroll = true;
        } catch (err) {
            console.error('Mesajlar yüklenemedi:', err);
            this.messages = [];
            this.conversationTags = [];
            this.conversationNotes = [];
            this.conversationOrders = [];
            this.customerDetail = null;
        }
    }

    isSending = false;
    isAiSending = false;
    autoAiMode = false;

    /** Son mesaj müşteriden mi geldi? */
    get isLastMessageFromCustomer(): boolean {
        if (this.messages.length === 0) return false;
        const last = this.messages[this.messages.length - 1];
        return last.source === 'user';
    }

    /** AI Chat butonuna basıldığında çalışır */
    async sendAiChat(): Promise<void> {
        if (!this.selectedConversation  ) return;

        const lastCustomerMsg = [...this.messages].reverse().find(m => m.source === 'user');
        if (!lastCustomerMsg) return;

        const conversationId = this.selectedConversation.id;
        const companyId = this.authStateService.profile?.companyId || '';
        const userId = this.authStateService.profile?.userId || '';

        this.isAiSending = true;
        const prevMessageCount = this.messages.length;
        try {
            const response = await this.messagesService.testAiChat({
                conversationId,
                companyId,
                message: lastCustomerMsg.text || '',
                userId: userId || undefined,
            });
            //console.log('✅ AI Chat yanıtı:', response);

            // Mesajları yeniden yükle (AI yanıtı SignalR ile de gelebilir)
            await this.loadMessages(conversationId);

            // AI yanıtı geldiyse ses çal
            if (this.messages.length > prevMessageCount) {
                this.incomingMessageSound.currentTime = 0;
                this.incomingMessageSound.play().catch(() => {});
            }
        } catch (err: any) {
            console.error('❌ AI Chat hatası:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('AI Chat hatası:\n' + msg);
        } finally {
            this.isAiSending = false;
        }
    }

    // ── File Upload ──
    openFileInput(): void {
        this.fileInput?.nativeElement?.click();
    }

    openImageInput(): void {
        this.imageInput?.nativeElement?.click();
    }

    onFileSelected(event: Event, isImage: boolean = false): void {
        const input = event.target as HTMLInputElement;
        const selectedFile = input.files?.[0];
        if (!selectedFile) return;

        // 10MB limit
        if (selectedFile.size > 10 * 1024 * 1024) {
            alert('Dosya boyutu en fazla 10MB olabilir.');
            input.value = '';
            return;
        }

        if (selectedFile.type.startsWith('image/')) {
            // Görsel ise önizleme için data URL oluştur
            const reader = new FileReader();
            reader.onload = () => {
                this.pendingFile = {
                    file: selectedFile,
                    name: selectedFile.name,
                    type: selectedFile.type,
                    size: selectedFile.size,
                    preview: reader.result as string
                };
            };
            reader.readAsDataURL(selectedFile);
        } else {
            this.pendingFile = {
                file: selectedFile,
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size
            };
        }
        input.value = ''; // aynı dosyanın tekrar seçilebilmesi için
    }

    removePendingFile(): void {
        this.pendingFile = null;
    }

    getFileIcon(type: string): string {
        if (type.startsWith('image/')) return 'fa-solid fa-image';
        if (type.includes('pdf')) return 'fa-solid fa-file-pdf';
        if (type.includes('word') || type.includes('document')) return 'fa-solid fa-file-word';
        if (type.includes('excel') || type.includes('spreadsheet')) return 'fa-solid fa-file-excel';
        if (type.includes('video')) return 'fa-solid fa-file-video';
        if (type.includes('audio')) return 'fa-solid fa-file-audio';
        if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'fa-solid fa-file-zipper';
        return 'fa-solid fa-file';
    }

    formatFileSize(bytes: number): string {
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    }

    async sendMessage(source: 'user' | 'assistant' = 'assistant'): Promise<void> {
        if ((!this.newMessage.trim() && !this.pendingFile) || !this.selectedConversation || this.isSending) return;

        const text = this.newMessage.trim();
        const conversationId = this.selectedConversation.id;
        const isNote = this.replyType === 'note';
        const fileData = this.pendingFile;

        // Optimistic UI: mesajı hemen göster
        const tempId = 'temp_' + Date.now();
        const optimisticMsg: ChatMessage = {
            id: tempId,
            conversationId,
            source: source,
            text: text || (fileData ? `📎 ${fileData.name}` : ''),
            imageUrl: fileData?.preview || undefined,
            isRead: false,
            createdDate: new Date().toISOString(),
        };
        this.messages.push(optimisticMsg);
        this.newMessage = '';
        this.pendingFile = null;
        this.shouldScroll = true;
        this.isSending = true;

        // Mesaj gönderildiğinde ses çal
        this.sentMessageSound.currentTime = 0;
        this.sentMessageSound.play().catch(() => {});

        try {
            const response = await this.messagesService.sendMessage({
                conversationId,
                messageContent: text || (fileData ? fileData.name : ''),
                source: isNote ? 'note' : source,
                file: fileData?.file || null,
            });

            // API'den dönen gerçek mesaj ID'sini güncelle
            const idx = this.messages.findIndex(m => m.id === tempId);
            if (idx !== -1 && response?.data?.id) {
                this.messages[idx] = { ...this.messages[idx], id: response.data.id };
            }

            // Sidebar'daki son mesajı güncelle
            const conv = this.conversations.find(c => c.id === conversationId);
            if (conv) {
                conv.lastMessage = text;
                conv.lastMessageDate = new Date().toISOString();
            }

            //console.log('✅ Mesaj gönderildi:', response);

            // Otomatik AI modu: user olarak gönderildiyse AI yanıt tetikle
            if (this.autoAiMode && source === 'user' && !this.isAiSending) {
                setTimeout(() => this.sendAiChat(), 500);
            }
        } catch (err) {
            console.error('❌ Mesaj gönderilemedi:', err);

            // Başarısız olan mesajı listeden kaldır
            const idx = this.messages.findIndex(m => m.id === tempId);
            if (idx !== -1) {
                this.messages.splice(idx, 1);
            }

            // Kullanıcıya mesajı geri koy
            this.newMessage = text;
        } finally {
            this.isSending = false;
        }
    }

    // ── Chat SignalR Event Handlers ──
    private incomingMessageSound = new Audio('assets/sounds/incoming-message-sound.mp3');
    private sentMessageSound = new Audio('assets/sounds/sended-message-sound.mp3');

    private onNewMessage(msg: ChatMessage): void {
        // Duplicate kontrolü: aynı mesaj zaten listede varsa ekleme
        const alreadyExists = this.messages.some(m => m.id === msg.id);
        if (alreadyExists) return;

        // Optimistic mesajla eşleşme: agent kendi gönderdiği mesajın gerçek ID'si geldi
        if (msg.source === 'assistant' && msg.conversationId === this.activeConversationId) {
            const tempIdx = this.messages.findIndex(m =>
                m.id.startsWith('temp_') &&
                m.conversationId === msg.conversationId &&
                m.text === msg.text
            );
            if (tempIdx !== -1) {
                // Temp mesajı gerçek mesajla değiştir
                this.messages[tempIdx] = msg;
                return;
            }
        }

        // Aktif sohbete gelen mesajı listeye ekle
        if (msg.conversationId === this.activeConversationId) {
            this.messages.push(msg);
            this.shouldScroll = true;
            this.typingUser = null;

            // AI mesajı geldiğinde bildirim sesi çal
            if (msg.source === 'ai') {
                this.incomingMessageSound.currentTime = 0;
                this.incomingMessageSound.play().catch(() => {});
            }

            // Mesajı okundu olarak işaretle
            if (msg.source !== 'assistant') {
                this.chatSignalR.markAsRead(msg.conversationId, msg.id);
            }

            // Otomatik AI modu: user mesajı geldiğinde AI yanıt gönder
            if (this.autoAiMode && msg.source === 'user' && !this.isAiSending) {
                setTimeout(() => this.sendAiChat(), 500);
            }
        }

        // Sidebar'daki sohbet bilgisini güncelle
        const conv = this.conversations.find(c => c.id === msg.conversationId);
        if (conv) {
            conv.lastMessage = msg.text;
            conv.lastMessageDate = msg.createdDate || new Date().toISOString();
            if (msg.conversationId !== this.activeConversationId) {
                conv.unreadCount = (conv.unreadCount || 0) + 1;
            }
        }
    }

    private onConversationUpdated(evt: any): void {
        const conv = this.conversations.find(c => c.id === evt.conversationId);
        if (conv) {
            if (evt.lastMessage !== undefined) conv.lastMessage = evt.lastMessage;
            if (evt.lastMessageDate !== undefined) conv.lastMessageDate = evt.lastMessageDate;
            if (evt.unreadCount !== undefined) conv.unreadCount = evt.unreadCount;
        }
    }

    private onNewConversation(evt: NewConversationEvent): void {
        //console.log('🆕 Yeni conversation alındı:', evt);

        // Zaten listede var mı kontrol et
        const exists = this.conversations.some(c => c.id === evt.id);
        if (exists) return;

        // Yeni conversation'ı listeye ekle (en üste)
        const newConv: ConversationHeader = {
            id: evt.id,
            customerName: evt.customerName,
            customerInitials: evt.customerName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
            customerAvatarColor: '#6c757d',
            integrationPhotoUrl: evt.integrationPhotoUrl,
            lastMessage: undefined,
            lastMessageDate: evt.createdDate,
            unreadCount: 1,
            isBlocked: false,
            isArchived: false,
            isFavorite: false,
        };

        this.conversations.unshift(newConv);
        this.totalConversationCount++;

        // Sidebar badge güncelle
        const msgSidebar = this.sidebarItems.find(s => s.path === 'messages');
        if (msgSidebar) {
            const currentBadge = parseInt(msgSidebar.badge || '0', 10);
            msgSidebar.badge = String(currentBadge + 1);
        }

        // 3 saniye sonra "new" işaretini kaldır
        setTimeout(() => {
            const conv = this.conversations.find(c => c.id === evt.id);
            if (conv) (conv as any).isNew = false;
        }, 3000);

        // Browser notification göster
        this.showBrowserNotification(`Yeni müşteri: ${evt.customerName}`);
    }

    private showBrowserNotification(message: string): void {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('AI Message', {
                body: message,
                icon: '/assets/icons/icon-72x72.png'
            });
        }
    }

    private onUserTyping(evt: TypingEvent): void {
        if (evt.conversationId !== this.activeConversationId) return;
        this.typingUser = evt.userName;

        // 3 saniye sonra yazıyor göstergesini kaldır
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.typingUser = null;
        }, 3000);
    }

    private onMessageRead(evt: any): void {
        if (evt.conversationId !== this.activeConversationId) return;
        const msg = this.messages.find(m => m.id === evt.messageId);
        if (msg) {
            msg.isRead = true;
        }
    }

    /** Yazıyor bilgisi gönder (input'tan tetiklenir) */
    notifyTyping(): void {
        if (this.activeConversationId) {
            this.chatSignalR.sendTyping(this.activeConversationId);
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.messages) return Array.isArray(response.messages) ? response.messages : (response.messages.$values ?? []);
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
        // Kısayol popup açıksa klavye navigasyonu
        if (this.showShortcutPopup && this.filteredShortcuts.length > 0) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.selectedShortcutIndex = (this.selectedShortcutIndex + 1) % this.filteredShortcuts.length;
                return;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.selectedShortcutIndex = (this.selectedShortcutIndex - 1 + this.filteredShortcuts.length) % this.filteredShortcuts.length;
                return;
            }
            if (event.key === 'Enter' || event.key === 'Tab') {
                event.preventDefault();
                this.selectShortcut(this.filteredShortcuts[this.selectedShortcutIndex]);
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                this.showShortcutPopup = false;
                return;
            }
        }

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage(this.autoAiMode ? 'user' : 'assistant');
        }
    }

    onMessageInput(): void {
        this.notifyTyping();
        const text = this.newMessage;
        // "/" ile başlayan kısayol aramayı tespit et
        const lastSlashIndex = text.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            // Slash'tan önce boşluk veya başlangıç olmalı
            const charBefore = lastSlashIndex === 0 ? ' ' : text[lastSlashIndex - 1];
            if (charBefore === ' ' || charBefore === '\n' || lastSlashIndex === 0) {
                const searchAfterSlash = text.substring(lastSlashIndex + 1);
                // Eğer arama metninde boşluk yoksa (tek kelime kısayol kodu)
                if (!searchAfterSlash.includes(' ')) {
                    this.shortcutSearchText = searchAfterSlash.toLowerCase();
                    this.filteredShortcuts = this.shortcuts.filter(s =>
                        !s.isBlocked &&
                        (s.shortCode.toLowerCase().includes(this.shortcutSearchText) ||
                         s.name.toLowerCase().includes(this.shortcutSearchText) ||
                         s.content.toLowerCase().includes(this.shortcutSearchText))
                    ).slice(0, 8);
                    this.showShortcutPopup = this.filteredShortcuts.length > 0;
                    this.selectedShortcutIndex = 0;
                    return;
                }
            }
        }
        this.showShortcutPopup = false;
    }

    selectShortcut(shortcut: Shortcut): void {
        const lastSlashIndex = this.newMessage.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            // "/arama" kısmını kısayol içeriğiyle değiştir
            this.newMessage = this.newMessage.substring(0, lastSlashIndex) + shortcut.content;
        }
        this.showShortcutPopup = false;
    }

    async loadShortcuts(): Promise<void> {
        try {
            const response = await this.shortcutsService.getPaged({ companyId: this.authStateService.profile?.companyId || '', pageNumber: 1, pageSize: 1000 });
            this.shortcuts = (response?.data?.items ?? []).filter((s: Shortcut) => !s.isBlocked);
        } catch (err) {
            console.error('Kısayollar yüklenemedi:', err);
            this.shortcuts = [];
        }
    }

    // ── Tag Methods ──
    async loadAllTags(): Promise<void> {
        try {
            const res = await this.tagsService.getPaged({ companyId: this.authStateService.profile?.companyId || '', pageNumber: 1, pageSize: 1000 });
            this.allTags = (res?.data?.items ?? []).filter((t: Tag) => !t.isBlocked);
        } catch { this.allTags = []; }
    }

    async loadConversationTags(conversationId: string): Promise<void> {
        try {
            const res = await this.conversationTagsService.getByConversation(conversationId);
            this.conversationTags = this.extractArray(res?.data);
        } catch { this.conversationTags = []; }
    }

    get filteredAvailableTags(): Tag[] {
        const assignedIds = new Set(this.conversationTags.map((ct: any) => ct.tagId));
        return this.allTags.filter(t =>
            !assignedIds.has(t.id) &&
            (!this.tagSearchText || t.name?.toLowerCase().includes(this.tagSearchText.toLowerCase()))
        );
    }

    async addTag(tag: Tag): Promise<void> {
        if (!this.selectedConversation) return;
        try {
            await this.conversationTagsService.create({
                conversationId: this.selectedConversation.id,
                tagId: tag.id,
                companyId: localStorage.getItem('companyId') || ''
            });
            await this.loadConversationTags(this.selectedConversation.id);
            this.showTagDropdown = false;
            this.tagSearchText = '';
        } catch (err) { console.error('Tag eklenemedi:', err); }
    }

    async removeTag(convTag: any): Promise<void> {
        if (!this.selectedConversation) return;
        try {
            await this.conversationTagsService.delete(convTag.id);
            await this.loadConversationTags(this.selectedConversation.id);
        } catch (err) { console.error('Tag silinemedi:', err); }
    }

    // ── Note Methods ──
    async loadConversationNotes(conversationId: string): Promise<void> {
        try {
            const res = await this.conversationNotesService.getByConversation(conversationId);
            this.conversationNotes = this.extractArray(res?.data);
        } catch { this.conversationNotes = []; }
    }

    async addNote(): Promise<void> {
        if (!this.selectedConversation || !this.newNoteContent.trim()) return;
        try {
            await this.conversationNotesService.create({
                conversationId: this.selectedConversation.id,
                userId: this.authStateService.profile?.userId || '',
                companyId: localStorage.getItem('companyId') || '',
                noteText: this.newNoteContent
            });
            await this.loadConversationNotes(this.selectedConversation.id);
            this.newNoteTitle = '';
            this.newNoteContent = '';
            this.showNoteForm = false;
        } catch (err) { console.error('Not eklenemedi:', err); }
    }

    async removeNote(convNote: any): Promise<void> {
        if (!this.selectedConversation) return;
        try {
            await this.conversationNotesService.delete(convNote.id);
            await this.loadConversationNotes(this.selectedConversation.id);
        } catch (err) { console.error('Not silinemedi:', err); }
    }

    // ── Segment Methods ──
    async loadAllSegments(): Promise<void> {
        try {
            const res = await this.segmentsService.getPaged({ companyId: this.authStateService.profile?.companyId || '', pageNumber: 1, pageSize: 1000 });
            this.allSegments = (res?.data?.items ?? []).filter((s: Segment) => !s.isBlocked);
        } catch { this.allSegments = []; }
    }

    async loadConversationSegments(conversationId: string): Promise<void> {
        try {
            const res = await this.conversationSegmentsService.getByConversation(conversationId);
            this.conversationSegments = this.extractArray(res?.data);
        } catch { this.conversationSegments = []; }
    }

    get filteredAvailableSegments(): Segment[] {
        const assignedIds = new Set(this.conversationSegments.map((cs: any) => cs.segmentId));
        return this.allSegments.filter(s =>
            !assignedIds.has(s.id) &&
            (!this.segmentSearchText || s.name?.toLowerCase().includes(this.segmentSearchText.toLowerCase()))
        );
    }

    async addSegment(segment: Segment): Promise<void> {
        if (!this.selectedConversation) return;
        try {
            await this.conversationSegmentsService.add({
                conversationId: this.selectedConversation.id,
                segmentId: segment.id,
                companyId: localStorage.getItem('companyId') || ''
            });
            await this.loadConversationSegments(this.selectedConversation.id);
            this.showSegmentDropdown = false;
            this.segmentSearchText = '';
        } catch (err) { console.error('Segment eklenemedi:', err); }
    }

    async removeSegment(convSegment: any): Promise<void> {
        if (!this.selectedConversation) return;
        try {
            await this.conversationSegmentsService.delete(this.selectedConversation.id, convSegment.segmentId);
            await this.loadConversationSegments(this.selectedConversation.id);
        } catch (err) { console.error('Segment silinemedi:', err); }
    }

    // ── Context Menu Methods ──
    openContextMenu(event: MouseEvent, conv: ConversationHeader): void {
        event.preventDefault();
        event.stopPropagation();
        this.contextMenuConv = conv;
        this.contextMenuX = event.clientX;
        this.contextMenuY = event.clientY;
    }

    closeContextMenu(): void {
        this.contextMenuConv = null;
    }

    @HostListener('document:click')
    onDocumentClick(): void {
        this.closeContextMenu();
    }

    async toggleBlock(conv: ConversationHeader): Promise<void> {
        this.closeContextMenu();
        const prev = conv.isBlocked;
        conv.isBlocked = !prev;  // optimistic
        try {
            await (prev
                ? this.conversationsService.unblock(conv.id)
                : this.conversationsService.block(conv.id));
        } catch (err) {
            conv.isBlocked = prev;  // rollback
            console.error('toggleBlock hatası:', err);
        }
    }

    async toggleArchive(conv: ConversationHeader): Promise<void> {
        this.closeContextMenu();
        const prev = conv.isArchived;
        conv.isArchived = !prev;  // optimistic
        try {
            await (prev
                ? this.conversationsService.unarchive(conv.id)
                : this.conversationsService.archive(conv.id));

            // Listeyi ve sidebar badge'lerini yeniden yükle
            await Promise.all([this.loadConversations(), this.loadSidebar()]);

            // Arşivlenen sohbet seçiliyse başka bir sohbet seç
            if (this.selectedConversation?.id === conv.id) {
                if (this.conversations.length > 0) {
                    this.selectConversation(this.conversations[0], true);
                } else {
                    this.selectedConversation = null;
                    this.activeConversationId = null;
                    this.messages = [];
                }
            }
        } catch (err) {
            conv.isArchived = prev;  // rollback
            console.error('toggleArchive hatası:', err);
        }
    }

    async toggleFavorite(conv: ConversationHeader): Promise<void> {
        this.closeContextMenu();
        const prev = conv.isFavorite;
        conv.isFavorite = !prev;  // optimistic
        try {
            await (prev
                ? this.conversationsService.unfavorite(conv.id)
                : this.conversationsService.favorite(conv.id));
        } catch (err) {
            conv.isFavorite = prev;  // rollback
            console.error('toggleFavorite hatası:', err);
        }
    }

    async toggleLock(conv: ConversationHeader): Promise<void> {
        this.closeContextMenu();
        const prev = conv.isLocked;
        conv.isLocked = !prev;  // optimistic
        try {
            await (prev
                ? this.conversationsService.unlock(conv.id)
                : this.conversationsService.lock(conv.id));
        } catch (err) {
            conv.isLocked = prev;  // rollback
            console.error('toggleLock hatası:', err);
        }
    }

    async toggleEscalate(conv: ConversationHeader): Promise<void> {
        this.closeContextMenu();
        const prev = conv.isEscalateToHuman;
        conv.isEscalateToHuman = !prev;  // optimistic
        try {
            await (prev
                ? this.conversationsService.unescalate(conv.id)
                : this.conversationsService.escalate(conv.id));
        } catch (err) {
            conv.isEscalateToHuman = prev;  // rollback
            console.error('toggleEscalate hatası:', err);
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

    /**
     * Metin içindeki URL'leri tıklanabilir <a> etiketlerine dönüştürür.
     * XSS koruması için önce HTML escape uygulanır.
     */
    linkify(text: string | undefined): string {
        if (!text) return '';
        // HTML escape
        const escaped = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        // URL regex
        const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
        return escaped.replace(urlRegex, (match) => {
            // Sondaki parantez, nokta, virgül gibi karakterleri URL'den ayır
            const trailingMatch = match.match(/[)\]},;:!?.']+$/);
            const url = trailingMatch ? match.slice(0, -trailingMatch[0].length) : match;
            const trailing = trailingMatch ? trailingMatch[0] : '';
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>${trailing}`;
        });
    }
}

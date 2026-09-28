import { AfterViewChecked, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatHistoryEntry, SidebarComponent } from '../sidebar/sidebar';
import { OrderBlockComponent } from '../order-block/order-block';
import { ConversationLogsPage } from '../../conversation-logs/conversation-logs';
import { ConversationsService } from '@/app/core/services/conversations.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AiRequestLogsService } from '@/app/core/services/ai-request-logs.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { AiAssistant } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { CompanyExtension } from '@/app/core/models/extension/company-extension.models';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import {
    AiChatBlockType,
    AiChatContentBlock,
    AiChatImageData,
    AiChatOrderData,
    AiChatTableData,
    ChatMessage,
    ConversationHeader,
    ConversationListResponse,
    ConversationMessageReactionRequest,
    ConversationMessagesResponse,
    ConversationReplyRequest,
    ConversationReplyResponse,
    ConversationStatsResponse,
    CreateTestConversationRequest,
} from '@/app/core/models/conversation/conversation.models';

interface MentionChip {
    id: string;
    name: string;
    mention: string;
    photoUrl?: string;
}

interface ExtensionShortcut extends MentionChip {
    category: string;
    subtitle: string;
    order: number;
    isEnabled: boolean;
}

interface ExtensionShortcutGroup {
    category: string;
    items: ExtensionShortcut[];
    /** Kart giris animasyonu gruplar arasinda kesintisiz sirayla oynasin diye. */
    startIndex: number;
}

interface ExtensionContent {
    category: string;
    title: string;
    subtitle: string;
    order: number;
}

interface UiTableCell {
    value: string;
    link: string | null;
    linkLabel: string;
    isImage: boolean;
}

interface UiTable {
    columns: string[];
    rows: UiTableCell[][];
    isTruncated: boolean;
}

interface UiChatBlock {
    type: AiChatBlockType;
    title: string | null;
    text: string | null;
    table: UiTable | null;
    images: AiChatImageData[];
    orders: AiChatOrderData[];
}

interface UiChatMessage {
    /** Sunucu kimligi; optimistic mesajlarda gecicidir. */
    id: string;
    /** @for track anahtari; optimistic mesaj sunucu kaydina donustugunde DOM yeniden olusmaz. */
    key: string;
    role: 'user' | 'assistant';
    content: string;
    createdDate: string | null;
    timeText: string;
    mentions: MentionChip[];
    blocks: UiChatBlock[];
    aiImageUrl: string | null;
    excelUrl: string | null;
    shareUrl: string | null;
    isLiked: boolean | null;
    isReactionSaving: boolean;
    isPending: boolean;
    animate: boolean;
}

interface ReactionReasonForm {
    reason: string;
    description: string;
}

interface StoredUserProfile {
    companyId?: string;
    name?: string;
    surname?: string;
}

const EXTENSION_CONTENT: Record<string, ExtensionContent> = {
    siparis: { category: 'Operasyon', title: 'Sipariş', subtitle: 'Sipariş durumu, hazırlık adımları ve iptal sürecini hızlıca sorgula.', order: 1 },
    fatura: { category: 'Finans', title: 'Fatura', subtitle: 'Faturalandırma, iade faturaları ve tahsilat kalemlerini incele.', order: 2 },
    sevkiyat: { category: 'Lojistik', title: 'Sevkiyat', subtitle: 'Kargo hazırlığı, teslimat ve gecikme nedenlerini tek noktadan gör.', order: 3 },
    transfer: { category: 'Depo', title: 'Transfer', subtitle: 'Depolar arası transfer taleplerini ve onay bekleyen hareketleri yönet.', order: 4 },
    musteri: { category: 'CRM', title: 'Müşteri', subtitle: 'Müşteri geçmişi, iletişim kayıtları ve son alışveriş trendini analiz et.', order: 5 },
    urun: { category: 'Katalog', title: 'Ürün', subtitle: 'Ürün kartı detayları, varyant bilgileri ve katalog metinlerini sorgula.', order: 6 },
    stok: { category: 'Envanter', title: 'Stok', subtitle: 'Anlık stok, kritik seviye uyarıları ve devir hızını karşılaştır.', order: 7 },
    wms: { category: 'Warehouse', title: 'WMS', subtitle: 'Toplama, yerleştirme, sayım ve lokasyon verimliliğini takip et.', order: 8 },
};

const SUPPORTED_BLOCK_TYPES = new Set<string>(['text', 'table', 'image', 'imageGallery', 'order']);
const IMAGE_COLUMN_HINTS = ['image', 'foto', 'gorsel', 'photo', 'picture'];
const MENTION_TOKEN_PATTERN = /(^|\s)(@[^\s@]+)/g;
const CONVERSATION_SELECTION_KEY = 'nac.conversationSelections';
const CONVERSATION_SELECTION_LIMIT = 200;

interface StoredConversationSelection {
    assistantId: string;
    mention: MentionChip | null;
}
// Backend .NET Guid parse ile uyumlu: canonical 8-4-4-4-12 hex format.
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';
const MOBILE_QUERY = '(max-width: 768px)';
const TOUCH_QUERY = '(pointer: coarse)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const SOUND_PREFERENCE_KEY = 'nebim-ai-chat-sound-enabled';
const SIDEBAR_PAGE_SIZE = 20;
const REPLY_POLL_ATTEMPTS = 12;
const REPLY_POLL_DELAY_MS = 800;
const SCROLL_DOWN_THRESHOLD = 240;
/** Sayfa yenilendiginde yalnizca bu sure icinde gonderilmis mesajin yaniti beklenir. */
const REPLY_WAIT_WINDOW_MS = 3 * 60_000;

@Component({
    selector: 'app-nebim-ai-chat',
    standalone: true,
    imports: [NgTemplateOutlet, FormsModule, SidebarComponent, OrderBlockComponent, ConversationLogsPage],
    templateUrl: './nebim-ai-chat.html',
    styleUrl: './nebim-ai-chat.scss'
})
export class NebimAiChatPage implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('scroller', { static: true }) scroller?: ElementRef<HTMLElement>;
    @ViewChild('textArea', { static: true }) textArea?: ElementRef<HTMLTextAreaElement>;

    messages: UiChatMessage[] = [];
    activeConversationId: string | null = null;
    conversationStats: ConversationStatsResponse | null = null;
    isSending = false;
    isLoadingThread = false;
    errorMessage = '';
    soundEnabled = true;
    /** Sağdan açılan sohbet logları paneli */
    showLogsPanel = false;
    /** Log paneli tüm ekranı kaplıyor mu */
    logsFullscreen = false;
    @ViewChild(ConversationLogsPage) logsPanel?: ConversationLogsPage;
    showScrollDown = false;
    composerFlash = false;

    sidebarChats: ChatHistoryEntry[] = [];
    hasMoreSidebarChats = false;
    isLoadingMoreChats = false;
    sidebarCollapsed = false;
    sidebarMobileOpen = false;

    input = '';
    assistants: AiAssistant[] = [];
    selectedAssistantId = '';
    assistantMenuOpen = false;

    /** Pasifler dahil tum eklentiler; gecmis mesajlardaki etiketlerin gorselini cozmek icin. */
    extensionShortcuts: ExtensionShortcut[] = [];
    enabledExtensionShortcuts: ExtensionShortcut[] = [];
    extensionGroups: ExtensionShortcutGroup[] = [];
    isLoadingExtensions = false;
    extensionMenuOpen = false;
    extensionMenuFilterText = '';
    /** Ayni anda tek etiket secilebilir; gonderimden sonra da secili kalir. */
    selectedMention: MentionChip | null = null;

    readonly dislikeReasons: string[] = [
        'Yanlış bilgi',
        'Eksik yanıt',
        'Soruyu anlamadı',
        'Yavaş yanıt',
        'Diğer',
    ];
    showReactionModal = false;
    reactionForm: ReactionReasonForm = { reason: '', description: '' };
    private reactionTarget: UiChatMessage | null = null;

    private mentionQuery: string | null = null;
    private extensionMenuOpenedByMention = false;
    private sidebarOpenedManually = false;
    private sidebarCurrentPage = 1;
    /** Liste yeniden yuklendiginde geciken "daha fazla" yanitlari yok sayilir. */
    private sidebarListVersion = 0;
    private hasHydratedThread = false;
    private pendingConversation: Promise<string | null> | null = null;
    /** Sohbet her degistiginde artar; geciken async islemlerin yanlis sohbete yazmasini engeller. */
    private conversationToken = 0;
    private sendingConversationId: string | null = null;
    private replyWaitConversationId: string | null = null;
    private pendingScroll: ScrollBehavior | null = null;
    private destroyed = false;
    private routeSub: Subscription | null = null;
    private readonly cleanups: (() => void)[] = [];
    private readonly keyboardSound = new Audio('assets/sounds/keyboard.mp3');
    private lastKeyboardSoundAt = 0;
    private flashTimer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private conversationsService: ConversationsService,
        private aiProvidersService: AiProvidersService,
        private aiRequestLogsService: AiRequestLogsService,
        private authState: AuthStateService,
        private extensionManagementService: ExtensionManagementService,
        private router: Router,
        private route: ActivatedRoute,
        private hostRef: ElementRef<HTMLElement>,
        private zone: NgZone,
    ) {}

    ngOnInit(): void {
        this.startViewportSync();
        this.startScrollTracking();
        this.loadSoundPreference();
        this.keyboardSound.preload = 'auto';
        this.keyboardSound.volume = 0.5;
        void this.initialize();
    }

    ngAfterViewChecked(): void {
        if (!this.pendingScroll) return;
        const behavior = this.pendingScroll;
        this.pendingScroll = null;
        this.scrollToBottom(behavior);
    }

    ngOnDestroy(): void {
        this.destroyed = true;
        this.routeSub?.unsubscribe();
        this.cleanups.forEach((cleanup) => cleanup());
        clearTimeout(this.flashTimer);
        this.keyboardSound.pause();
    }

    private async initialize(): Promise<void> {
        // Gecmis mesajlardaki etiket gorselleri eklenti listesine bagli oldugu icin
        // route senkronizasyonu veriler yuklendikten sonra baslar.
        await Promise.all([
            this.loadConversationList(),
            this.loadAssistants(),
            this.loadExtensionShortcuts(),
        ]);
        if (this.destroyed) return;

        // paramMap abone olundugu anda mevcut degeri yayar; ayrica snapshot okumaya gerek yok.
        this.routeSub = this.route.paramMap.subscribe((params) => {
            void this.syncConversationFromRoute(params.get('conversationId'));
        });
    }

    // ── Görünüm / layout ─────────────────────────────────────────────

    get selectedAssistantLabel(): string {
        const assistant = this.assistants.find((item) => item.id === this.selectedAssistantId) ?? this.assistants[0];
        return assistant?.name?.trim() || 'Asistan seç';
    }

    /**
     * Sohbet ilk kullanici mesajiyla basladiktan sonra asistan ve eklenti degistirilemez;
     * sohbet bitene kadar baslangicta secilenlerle devam edilir.
     */
    get isSelectionLocked(): boolean {
        return this.messages.some((message) => message.role === 'user');
    }

    /** Etiket yalnizca sohbetin ilk mesajindan belirlenebildiyse kilitlenir. */
    get isMentionLocked(): boolean {
        return this.isSelectionLocked && !!this.selectedMention;
    }

    get composerPlaceholder(): string {
        return this.selectedMention ? 'Nebim AI\'a bir mesaj gönder...' : 'Önce + ile bir eklenti seç ya da @ yaz...';
    }

    /** Menu @ yazilarak acildiysa ilk oneri Enter/Tab ile secilir. */
    get isMentionAutocomplete(): boolean {
        return this.extensionMenuOpen && this.extensionMenuOpenedByMention;
    }

    get isAssistantTyping(): boolean {
        const id = this.activeConversationId;
        return !!id && (this.sendingConversationId === id || this.replyWaitConversationId === id);
    }

    get quotaText(): string {
        const quota = this.conversationStats?.quota;
        if (!quota) return '';
        if (quota.isUnlimited) return 'Sınırsız mesaj hakkı';
        if (quota.remainingMessageCount === null) return '';
        const max = quota.maxMessageCount !== null ? ` / ${quota.maxMessageCount}` : '';
        return `Kalan mesaj hakkı: ${quota.remainingMessageCount}${max}`;
    }

    get tokenUsageText(): string {
        const totalTokens = this.conversationStats?.totalTokens;
        return totalTokens ? `Bu sohbet: ${Number(totalTokens).toLocaleString('tr-TR')} token` : '';
    }

    /**
     * Mobil tarayicilarda yazilim klavyesi acildiginda layout viewport degismedigi icin
     * sabit konumlu chat kabugu klavyenin altinda kaliyor. Gercek gorunur viewport
     * olculeri CSS degiskenlerine yazilarak composer her zaman gorunur tutulur.
     */
    private startViewportSync(): void {
        const viewport = window.visualViewport;
        const target: EventTarget = viewport ?? window;
        const events = viewport ? ['resize', 'scroll'] : ['resize', 'orientationchange'];
        const apply = () => {
            const host = this.hostRef.nativeElement;
            const height = Math.round(viewport?.height ?? window.innerHeight);
            host.style.setProperty('--nac-viewport-height', `${height}px`);
            host.style.setProperty('--nac-viewport-offset', `${Math.round(viewport?.offsetTop ?? 0)}px`);

            // Klavye acikken ipucu satiri, cok alcak ekranlarda (yatay telefon) header da gizlenir.
            const keyboardOpen = window.innerHeight - height > 150;
            host.classList.toggle('nac-keyboard-open', keyboardOpen);
            host.classList.toggle('nac-compact', keyboardOpen && height < 480);
        };

        apply();
        this.zone.runOutsideAngular(() => events.forEach((name) => target.addEventListener(name, apply)));
        this.cleanups.push(() => events.forEach((name) => target.removeEventListener(name, apply)));
    }

    /** "En alta git" butonu icin; scroll olaylari change detection tetiklemesin diye zone disinda dinlenir. */
    private startScrollTracking(): void {
        const el = this.scroller?.nativeElement;
        if (!el) return;

        const onScroll = () => {
            const show = el.scrollHeight - el.scrollTop - el.clientHeight > SCROLL_DOWN_THRESHOLD;
            if (show !== this.showScrollDown) {
                this.zone.run(() => (this.showScrollDown = show));
            }
        };

        this.zone.runOutsideAngular(() => el.addEventListener('scroll', onScroll, { passive: true }));
        this.cleanups.push(() => el.removeEventListener('scroll', onScroll));
    }

    scrollToBottom(behavior: ScrollBehavior = 'smooth'): void {
        const el = this.scroller?.nativeElement;
        if (!el) return;
        const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches;
        el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion ? 'instant' : behavior });
    }

    private requestScroll(behavior: ScrollBehavior = 'smooth'): void {
        this.pendingScroll = behavior;
    }

    private isMobileViewport(): boolean {
        return window.matchMedia(MOBILE_QUERY).matches;
    }

    private isTouchDevice(): boolean {
        return window.matchMedia(TOUCH_QUERY).matches;
    }

    /** Dokunmatik cihazda klavyeyi acmadan, composer'a eklenen degeri kisa bir vurguyla gosterir. */
    private flashComposer(): void {
        clearTimeout(this.flashTimer);
        this.composerFlash = false;
        this.flashTimer = setTimeout(() => {
            this.composerFlash = true;
            this.flashTimer = setTimeout(() => (this.composerFlash = false), 700);
        });
    }

    /** Header hamburger ve sidebar icindeki toggle: mobilde drawer'i, masaustunde daraltmayi yonetir. */
    toggleSidebar(): void {
        if (this.isMobileViewport()) {
            this.sidebarMobileOpen = !this.sidebarMobileOpen;
            // Mobil drawer her zaman tam genislikte acilmali
            if (this.sidebarMobileOpen) this.sidebarCollapsed = false;
            return;
        }

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.sidebarOpenedManually = !this.sidebarCollapsed;
    }

    closeMobileSidebar(): void {
        this.sidebarMobileOpen = false;
    }

    toggleSound(): void {
        this.soundEnabled = !this.soundEnabled;
        try {
            localStorage.setItem(SOUND_PREFERENCE_KEY, this.soundEnabled ? '1' : '0');
        } catch {
            // Storage kullanilamiyor; tercih yalnizca bu oturumda gecerli.
        }
    }

    private loadSoundPreference(): void {
        // Dokunmatik cihazlarda HTMLAudio arka plandaki muzigi kestigi icin tus sesi varsayilan olarak kapali.
        this.soundEnabled = !this.isTouchDevice();
        try {
            const raw = localStorage.getItem(SOUND_PREFERENCE_KEY);
            if (raw === '0' || raw === '1') {
                this.soundEnabled = raw === '1';
            }
        } catch {
            // Storage kullanilamiyor; varsayilan tercih korunur.
        }
    }

    // iOS Safari tiklanamayan alanlara dokunuldugunda click uretmedigi icin pointerdown dinlenir.
    @HostListener('document:pointerdown', ['$event'])
    onDocumentPointerDown(event: PointerEvent): void {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        if (this.assistantMenuOpen && !target.closest('.nac-assistant-picker')) {
            this.assistantMenuOpen = false;
        }

        if (this.extensionMenuOpen && !target.closest('.nac-extension-picker')) {
            this.closeExtensionMenu();
        }
    }

    @HostListener('document:keydown.escape')
    onEscape(): void {
        if (this.showLogsPanel) {
            // Tam ekrandaysa önce tam ekrandan çık, sonra paneli kapat
            if (this.logsPanel?.fullscreen) this.logsPanel.exitFullscreen();
            else this.closeLogsPanel();
        } else if (this.showReactionModal) {
            this.closeReactionModal();
        } else if (this.extensionMenuOpen || this.assistantMenuOpen) {
            this.closeExtensionMenu();
            this.assistantMenuOpen = false;
        } else if (this.sidebarMobileOpen) {
            this.sidebarMobileOpen = false;
        }
    }

    // ── Sohbet logları paneli ────────────────────────────────────────

    toggleLogsPanel(): void {
        if (!this.activeConversationId) return;
        this.showLogsPanel = !this.showLogsPanel;
        // Panel doğrudan tam ekran açılır; tam ekrandan çıkınca yan panel olarak kalır
        this.logsFullscreen = this.showLogsPanel;
    }

    closeLogsPanel(): void {
        this.showLogsPanel = false;
        this.logsFullscreen = false;
    }

    // ── Asistan & eklenti seçimi ─────────────────────────────────────

    toggleAssistantMenu(): void {
        if (this.isSelectionLocked) return;
        this.assistantMenuOpen = !this.assistantMenuOpen;
        if (this.assistantMenuOpen) this.closeExtensionMenu();
    }

    selectAssistant(assistantId: string): void {
        if (this.isSelectionLocked) return;
        this.selectedAssistantId = assistantId;
        this.assistantMenuOpen = false;
    }

    get filteredExtensionShortcuts(): ExtensionShortcut[] {
        const query = this.mentionQuery ?? this.toLookupKey(this.extensionMenuFilterText);
        if (!query) return this.enabledExtensionShortcuts;

        const exactKey = this.toLookupKey(this.normalizeMention(query));
        return this.enabledExtensionShortcuts
            .filter((item) => this.toLookupKey(item.mention).includes(query) || this.toLookupKey(item.name).includes(query))
            // Tam eslesen etiket (@stok) basa alinir; Enter/Tab onu secer (@stokrapor degil).
            .sort((a, b) => Number(this.toLookupKey(b.mention) === exactKey) - Number(this.toLookupKey(a.mention) === exactKey));
    }

    onExtensionTriggerClick(): void {
        if (this.isMentionLocked) return;
        const shortcuts = this.enabledExtensionShortcuts;
        if (!shortcuts.length) return;

        if (shortcuts.length === 1) {
            this.selectExtensionShortcut(shortcuts[0]);
            return;
        }

        const open = !this.extensionMenuOpen;
        this.closeExtensionMenu();
        this.extensionMenuFilterText = '';
        this.extensionMenuOpen = open;
        this.assistantMenuOpen = false;
    }

    /** Menuden, bos ekran kartlarindan veya @ otomatik tamamlamasindan etiket secer. */
    selectExtensionShortcut(shortcut: ExtensionShortcut): void {
        if (this.isMentionLocked) return;
        const openedByMention = this.isMentionAutocomplete;
        this.closeExtensionMenu();
        this.selectedMention = this.toChip(shortcut);
        this.errorMessage = '';

        if (openedByMention) {
            this.removeMentionTokenAtCaret();
        } else {
            this.focusComposer();
        }
    }

    onExtensionMenuFilterInput(): void {
        // Elle yazilan filtre, @ otomatik tamamlama sorgusunun onune gecer.
        this.mentionQuery = null;
    }

    removeSelectedMention(): void {
        if (this.isMentionLocked) return;
        this.selectedMention = null;
    }

    private closeExtensionMenu(): void {
        this.extensionMenuOpen = false;
        this.extensionMenuOpenedByMention = false;
        this.mentionQuery = null;
    }

    private toChip(shortcut: MentionChip): MentionChip {
        return { id: shortcut.id, name: shortcut.name, mention: shortcut.mention, photoUrl: shortcut.photoUrl };
    }

    private findShortcut(mention: string, source = this.extensionShortcuts): ExtensionShortcut | undefined {
        const key = this.toLookupKey(this.normalizeMention(mention));
        return source.find((item) => this.toLookupKey(item.mention) === key);
    }

    private normalizeMention(mention: string | null | undefined): string {
        const raw = (mention || '').trim();
        if (!raw) return '';
        return raw.startsWith('@') ? raw : `@${raw}`;
    }

    private toLookupKey(value: string | null | undefined): string {
        return (value || '')
            .toLocaleLowerCase('tr-TR')
            .trim()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .replace(/ı/g, 'i');
    }

    // ── Composer ─────────────────────────────────────────────────────

    onComposerKeydown(event: KeyboardEvent): void {
        if (event.isComposing) return;

        if (event.key === 'Enter' && !event.shiftKey) {
            if (this.acceptMentionSuggestion()) {
                event.preventDefault();
                return;
            }
            // Dokunmatik klavyede Shift+Enter olmadigi icin Enter yeni satir ekler; gonderim butonla yapilir.
            if (!this.isTouchDevice()) {
                event.preventDefault();
                void this.send();
                return;
            }
        }

        if (event.key === 'Tab') {
            if (this.acceptMentionSuggestion()) event.preventDefault();
            return;
        }

        if (event.key === 'ArrowUp' && this.recallLastUserMessage()) {
            event.preventDefault();
            return;
        }

        this.playTypingSound(event);
    }

    // Yapistirilan metnin sonundaki bosluk/satir sonlarini kirp
    onComposerPaste(event: ClipboardEvent): void {
        const pasted = event.clipboardData?.getData('text/plain');
        const trimmed = pasted?.trimEnd();
        if (!pasted || trimmed === pasted) return;

        event.preventDefault();
        const el = event.target as HTMLTextAreaElement;
        const start = el.selectionStart ?? this.input.length;
        const end = el.selectionEnd ?? this.input.length;
        this.input = `${this.input.slice(0, start)}${trimmed}${this.input.slice(end)}`;

        setTimeout(() => {
            const caret = start + (trimmed?.length ?? 0);
            el.setSelectionRange(caret, caret);
            this.onComposerInput();
        });
    }

    onComposerInput(): void {
        this.autoResize();
        this.captureTypedMention();
        this.updateMentionAutocomplete();

        if (this.input && !this.sidebarOpenedManually && !this.isMobileViewport()) {
            this.sidebarCollapsed = true;
        }
    }

    onComposerFocus(): void {
        // Mobil klavyenin acilma animasyonu bittikten sonra son mesaja kaydir.
        if (this.isMobileViewport()) {
            setTimeout(() => this.scrollToBottom(), 300);
        }
    }

    autoResize(): void {
        const el = this.textArea?.nativeElement;
        if (!el) return;
        el.style.height = 'auto';
        const maxHeight = parseFloat(getComputedStyle(el).maxHeight) || 200;
        el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
        // Sinir asildiginda icerik kaydirilabilir olmali; aksi halde fazlasi gorunmez kalir.
        el.classList.toggle('is-scrollable', el.scrollHeight > maxHeight);
    }

    insertTableCellValue(value: string, event?: Event): void {
        event?.preventDefault();

        const text = value.trim();
        if (!text || text === '-') return;

        const current = this.input.trimEnd();
        this.input = current ? `${current} ${text}` : text;
        this.onComposerInput();

        if (this.isTouchDevice()) {
            // Klavyeyi acip okunan tablodan son mesaja kaydirmak yerine composer'i vurgula.
            this.flashComposer();
            setTimeout(() => this.autoResize());
        } else {
            this.focusComposer(this.input.length);
        }
    }

    private acceptMentionSuggestion(): boolean {
        if (!this.isMentionAutocomplete) return false;

        const suggestion = this.filteredExtensionShortcuts[0];
        if (!suggestion) return false;

        this.selectExtensionShortcut(suggestion);
        return true;
    }

    // Input bosken yukari ok: son gonderilen mesaji (ve etiketini) input'a geri getirir
    private recallLastUserMessage(): boolean {
        if (this.input.trim()) return false;

        const last = [...this.messages].reverse().find((message) => message.role === 'user' && message.content);
        if (!last) return false;

        this.input = last.content;
        const mention = last.mentions[0] && this.findShortcut(last.mentions[0].mention, this.enabledExtensionShortcuts);
        if (mention) {
            this.selectedMention = this.toChip(mention);
        }
        this.focusComposer(last.content.length);
        return true;
    }

    /**
     * Yazilan etiket (@siparis) aktif bir eklentiyle eslesirse metinden cikarilip chip'e donusturulur.
     * Imlecin hemen onundeki etiket hala yaziliyor olabilecegi icin (@stok → @stokrapor) gonderime kadar beklenir.
     */
    private captureTypedMention(includeTokenAtCaret = false): void {
        // Kilitli sohbette yazilan @etiket metnin parcasi olarak kalir, eklentiyi degistirmez.
        if (this.isMentionLocked || !this.input.includes('@')) return;

        const caret = this.textArea?.nativeElement.selectionStart ?? this.input.length;
        const result = this.removeMentionTokens(this.input, caret, (token, tokenEnd) =>
            (includeTokenAtCaret || tokenEnd !== caret) && !!this.findShortcut(token, this.enabledExtensionShortcuts));

        // Birden fazla etiket yazilirsa sonuncusu gecerli olur
        const matched = result.tokens.length && this.findShortcut(result.tokens[result.tokens.length - 1], this.enabledExtensionShortcuts);
        if (!matched) return;

        this.selectedMention = this.toChip(matched);
        this.input = result.text;
        this.restoreCaret(result.caret);
    }

    /** Eslesen etiketleri ve hemen ardindaki tek boslugu metinden cikarir; imlecin yeni konumunu da hesaplar. */
    private removeMentionTokens(
        text: string,
        caret: number,
        shouldRemove: (token: string, tokenEnd: number) => boolean,
    ): { text: string; caret: number; tokens: string[] } {
        const tokens: string[] = [];
        let result = '';
        let cursor = 0;
        let nextCaret = caret;

        for (const match of text.matchAll(MENTION_TOKEN_PATTERN)) {
            const start = (match.index ?? 0) + match[1].length;
            const tokenEnd = start + match[2].length;
            if (!shouldRemove(match[2], tokenEnd)) continue;

            const end = /[ \t]/.test(text.charAt(tokenEnd)) ? tokenEnd + 1 : tokenEnd;
            tokens.push(match[2]);
            result += text.slice(cursor, start);
            cursor = end;
            if (start < caret) nextCaret -= Math.min(caret, end) - start;
        }

        return { text: result + text.slice(cursor), caret: nextCaret, tokens };
    }

    private updateMentionAutocomplete(): void {
        if (this.isMentionLocked) {
            if (this.extensionMenuOpenedByMention) this.closeExtensionMenu();
            return;
        }
        const caret = this.textArea?.nativeElement.selectionStart ?? this.input.length;
        const match = this.input.slice(0, caret).match(/(^|\s)@([^\s@]*)$/);
        this.mentionQuery = match ? this.toLookupKey(match[2]) : null;

        if (this.mentionQuery !== null && this.filteredExtensionShortcuts.length) {
            this.extensionMenuOpen = true;
            this.extensionMenuOpenedByMention = true;
            this.assistantMenuOpen = false;
        } else if (this.extensionMenuOpenedByMention) {
            this.closeExtensionMenu();
        }
    }

    private removeMentionTokenAtCaret(): void {
        const caret = this.textArea?.nativeElement.selectionStart ?? this.input.length;
        const before = this.input.slice(0, caret).replace(/(^|\s)@[^\s@]*$/, '$1');
        this.input = `${before}${this.input.slice(caret)}`;
        this.focusComposer(before.length);
    }

    /** ngModel degeri DOM'a yazdiginda imlec sona atlar; kullanici yaziyorsa eski konumuna geri al. */
    private restoreCaret(caret: number): void {
        setTimeout(() => {
            const el = this.textArea?.nativeElement;
            if (el && document.activeElement === el) {
                el.setSelectionRange(caret, caret);
            }
            this.autoResize();
        });
    }

    private focusComposer(caret?: number): void {
        setTimeout(() => {
            const el = this.textArea?.nativeElement;
            if (!el) return;
            el.focus();
            if (caret !== undefined) el.setSelectionRange(caret, caret);
            this.autoResize();
        });
    }

    // ── Mesaj gönderimi ──────────────────────────────────────────────

    async send(): Promise<void> {
        if (this.isSending) return;

        // Sonuna bosluk birakilmadan yazilmis etiket de gonderimde chip'e donusturulur.
        this.captureTypedMention(true);
        const content = this.input.trim();
        if (!content) return;

        const mention = this.selectedMention;
        if (!mention) {
            this.errorMessage = 'Mesaj gönderebilmek için bir eklenti etiketi seçmelisin (örn: @siparis).';
            return;
        }

        const companyId = this.getCompanyId();
        if (!companyId) {
            this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
            return;
        }

        this.isSending = true;
        this.errorMessage = '';

        try {
            const conversationId = this.activeConversationId ?? await this.startNewConversation(false);
            if (!conversationId) return;

            if (!GUID_PATTERN.test(conversationId) || conversationId === EMPTY_GUID) {
                this.errorMessage = 'Geçersiz konuşma kimliği.';
                return;
            }

            // Ilk mesajda secilen asistan + eklenti bu sohbet icin sabitlenir.
            if (!this.isSelectionLocked) {
                this.rememberConversationSelection(conversationId, this.selectedAssistantId, mention);
            }

            const optimisticId = this.uid();
            this.messages = [
                ...this.messages,
                {
                    id: optimisticId,
                    key: optimisticId,
                    role: 'user',
                    content,
                    createdDate: new Date().toISOString(),
                    timeText: this.formatMessageTime(new Date()),
                    mentions: [{ ...mention }],
                    blocks: [],
                    aiImageUrl: null,
                    excelUrl: null,
                    shareUrl: null,
                    isLiked: null,
                    isReactionSaving: false,
                    isPending: true,
                    animate: true,
                },
            ];
            this.hasHydratedThread = true;
            this.sendingConversationId = conversationId;
            this.input = '';
            this.playKeyboardSound();
            this.requestScroll();
            setTimeout(() => this.autoResize());

            // Conversations/{conversationId}/reply kullanici + AI akisini tek istekte calistirir
            const request: ConversationReplyRequest = {
                companyId,
                message: `${mention.mention} ${content}`,
                assistantId: this.selectedAssistantId || null,
                file: null,
                fileType: null,
            };
            const response = await this.conversationsService.reply(conversationId, request);
            void this.loadConversationList();

            if (this.activeConversationId !== conversationId) return;

            if (!response.isSuccess) {
                this.errorMessage = 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
                return;
            }

            const aiFailed = response.data ? this.applyReplyResponse(response.data) : false;

            // Backend ilk yaniti asenkron uretebiliyor; F5 gerektirmemesi icin
            // kisa sureli messages polling fallback'i uygulanir. AI hata dondurduyse beklenecek yanit yoktur.
            if (!aiFailed && this.isAwaitingAssistantReply()) {
                await this.waitForAssistantMessage(conversationId);
            }
        } catch (err) {
            console.error('[NebimAiChat] Mesaj gönderilemedi:', err);
            this.errorMessage = 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
        } finally {
            this.isSending = false;
            this.sendingConversationId = null;
            this.requestScroll();
        }
    }

    /** Reply yanitini uygular; AI basarisiz olduysa true doner. */
    private applyReplyResponse(response: ConversationReplyResponse): boolean {
        if (response.conversation) {
            this.applyServerMessages(this.mapConversationMessages(response.conversation));
        }

        if (response.stats) {
            this.conversationStats = response.stats;
        }

        const aiResponse = response.aiResponse;
        if (aiResponse && !aiResponse.success) {
            this.errorMessage = aiResponse.error || aiResponse.response || 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
            return true;
        }
        return false;
    }

    private isAwaitingAssistantReply(): boolean {
        return this.messages.at(-1)?.role === 'user';
    }

    private async waitForAssistantMessage(conversationId: string): Promise<void> {
        if (this.replyWaitConversationId === conversationId) return;

        this.replyWaitConversationId = conversationId;
        const isStale = () => this.destroyed || this.activeConversationId !== conversationId;

        try {
            for (let attempt = 0; attempt < REPLY_POLL_ATTEMPTS; attempt++) {
                await this.sleep(REPLY_POLL_DELAY_MS);
                if (isStale()) return;

                const response = await this.conversationsService.getMessages(conversationId);
                if (isStale()) return;
                if (!response.isSuccess || !response.data) continue;

                this.applyServerMessages(this.mapConversationMessages(response.data));
                if (!this.isAwaitingAssistantReply()) {
                    this.errorMessage = '';
                    return;
                }
            }
        } catch (err) {
            console.warn('[NebimAiChat] AI yanıtı takip edilirken hata oluştu:', err);
        } finally {
            if (this.replyWaitConversationId === conversationId) {
                this.replyWaitConversationId = null;
            }
        }
    }

    /**
     * Sunucudan gelen listeyi ekrandakiyle birlestirir: bilinen mesajlarin track anahtari korunur,
     * optimistic kullanici mesaji sunucu kaydiyla eslesir, yalnizca gercekten yeni olanlar animasyon alir.
     */
    private applyServerMessages(next: UiChatMessage[]): void {
        // Bos yanit ekrandaki (optimistic) mesajlari silmemeli.
        if (!next.length && this.messages.length) return;

        if (!this.hasHydratedThread) {
            this.messages = next;
            this.hasHydratedThread = true;
            this.requestScroll('instant');
            return;
        }

        const previousById = new Map(this.messages.map((message) => [message.id, message]));
        const pending = this.messages.filter((message) => message.isPending);
        let hasNewMessage = false;

        for (const message of next) {
            const previous = previousById.get(message.id) ?? this.takePendingMatch(pending, message);
            if (previous) {
                message.key = previous.key;
            } else {
                message.animate = true;
                hasNewMessage = true;
            }
        }

        this.messages = next;
        if (hasNewMessage) {
            this.playKeyboardSound();
            this.requestScroll();
        }
    }

    private takePendingMatch(pending: UiChatMessage[], message: UiChatMessage): UiChatMessage | undefined {
        const text = this.collapseWhitespace(message.content);
        const index = pending.findIndex((item) => item.role === message.role && this.collapseWhitespace(item.content) === text);
        return index >= 0 ? pending.splice(index, 1)[0] : undefined;
    }

    // ── Sohbet yaşam döngüsü ─────────────────────────────────────────

    newChat(): void {
        this.resetConversationState();
        this.sidebarMobileOpen = false;
        void this.startNewConversation(false);
        // Mobilde klavye acilip bos ekrandaki eklenti kartlarini kapatmasin.
        if (!this.isMobileViewport()) this.focusComposer();
    }

    async onSelectChat(conversationId: string): Promise<void> {
        this.sidebarMobileOpen = false;
        await this.router.navigate(['/c', conversationId]);
    }

    private async syncConversationFromRoute(conversationId: string | null): Promise<void> {
        if (!conversationId) {
            this.resetConversationState();
            await this.startNewConversation(true);
            return;
        }

        // Bu sayfadan yeni baslatilan sohbet navigasyondan once aktif yapilir; backend ilk mesaji
        // henuz kaydetmedigi icin sunucudan yuklenmez, guncel icerik reply yanitindan gelir.
        if (conversationId === this.activeConversationId) return;

        this.clearThread();
        this.activeConversationId = conversationId;
        await this.loadThread(conversationId);
    }

    /** Ayni anda yalnizca bir sohbet olusturulur; route ve gonderim ayni istegi paylasir. */
    private startNewConversation(replaceUrl: boolean): Promise<string | null> {
        this.pendingConversation ??= this.createAndOpenConversation(replaceUrl)
            .finally(() => (this.pendingConversation = null));
        return this.pendingConversation;
    }

    private async createAndOpenConversation(replaceUrl: boolean): Promise<string | null> {
        const token = this.conversationToken;
        const conversationId = await this.createConversation();
        // Bu arada kullanici baska bir sohbete gectiyse yeni sohbeti acma.
        if (!conversationId || this.destroyed || token !== this.conversationToken) return null;

        this.activeConversationId = conversationId;
        this.hasHydratedThread = true;
        void this.loadConversationList();
        await this.router.navigate(['/c', conversationId], { replaceUrl });
        return conversationId;
    }

    private async createConversation(): Promise<string | null> {
        const companyId = this.getCompanyId();
        if (!companyId) {
            this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
            return null;
        }

        const profile = this.authState.profile;
        const storedProfile = this.readStoredProfile();
        const request: CreateTestConversationRequest = {
            companyId,
            firstName: profile?.name || storedProfile?.name || 'Test',
            lastName: profile?.lastName || profile?.surname || storedProfile?.surname || 'User',
            userIntSmaId: null,
        };

        try {
            const response = await this.conversationsService.createTestConversation(request);
            const conversationId = response.data?.conversationId?.trim();
            if (conversationId) return conversationId;
        } catch (err) {
            console.error('[NebimAiChat] Sohbet oluşturulamadı:', err);
        }

        this.errorMessage = 'Yeni sohbet oluşturulamadı.';
        return null;
    }

    private async loadThread(conversationId: string): Promise<void> {
        this.isLoadingThread = true;
        try {
            const response = await this.conversationsService.getMessages(conversationId);
            // Yanit geldiginde kullanici baska bir sohbete gecmis olabilir.
            if (this.activeConversationId !== conversationId) return;

            this.applyServerMessages(response.data ? this.mapConversationMessages(response.data) : []);
            void this.restoreConversationSelection(conversationId);

            // Sayfa yenileme gibi durumlarda thread ilk etapta sadece kullanici mesaji
            // donebilir; AI mesaji gelene kadar kisa sureli takip et. Eski ve yanitsiz
            // kalmis sohbetlerde bos yere polling yapilmaz.
            if (this.isAwaitingAssistantReply() && this.isRecent(this.messages.at(-1)?.createdDate)) {
                void this.waitForAssistantMessage(conversationId);
            }
        } catch (err) {
            console.error('[NebimAiChat] Thread yüklenemedi:', err);
            if (this.activeConversationId === conversationId) {
                this.errorMessage = 'Sohbet mesajları yüklenemedi.';
            }
        } finally {
            if (this.activeConversationId === conversationId) {
                this.isLoadingThread = false;
            }
        }
    }

    /** Ekrandaki sohbeti bosaltir; taslak mesaj ve secili etiket korunur. */
    private clearThread(): void {
        this.conversationToken++;
        this.messages = [];
        this.conversationStats = null;
        this.errorMessage = '';
        this.hasHydratedThread = false;
        this.isLoadingThread = false;
        this.showScrollDown = false;
        this.closeReactionModal();
    }

    private resetConversationState(): void {
        this.clearThread();
        this.activeConversationId = null;
        this.input = '';
        setTimeout(() => this.autoResize());
    }

    // ── Sohbet başına sabit asistan / eklenti ────────────────────────

    /**
     * Mevcut bir sohbet acildiginda baslangicta secilen eklenti ve asistani geri yukler.
     * Eklenti ilk kullanici mesajindaki etiketten, asistan once yerel kayittan,
     * yoksa sohbetin AI istek loglarindaki assistantId'den bulunur.
     */
    private async restoreConversationSelection(conversationId: string): Promise<void> {
        if (!this.isSelectionLocked) return;

        const firstMention = this.messages.find((message) => message.role === 'user' && message.mentions.length)?.mentions[0];
        const stored = this.readConversationSelection(conversationId);
        const mention = firstMention ?? stored?.mention ?? null;
        if (mention) {
            const shortcut = this.findShortcut(mention.mention);
            this.selectedMention = shortcut ? this.toChip(shortcut) : { ...mention };
        }
        this.closeExtensionMenu();
        this.assistantMenuOpen = false;

        if (stored?.assistantId && this.assistants.some((item) => item.id === stored.assistantId)) {
            this.selectedAssistantId = stored.assistantId;
            return;
        }

        try {
            const response = await this.aiRequestLogsService.getByConversation(conversationId);
            if (this.activeConversationId !== conversationId) return;
            const firstWithAssistant = this.extractArray<{ assistantId?: string; createdDate: string }>(response.data)
                .filter((log) => !!log.assistantId)
                .sort((a, b) => this.toEpoch(a.createdDate) - this.toEpoch(b.createdDate))[0];
            if (firstWithAssistant?.assistantId && this.assistants.some((item) => item.id === firstWithAssistant.assistantId)) {
                this.selectedAssistantId = firstWithAssistant.assistantId;
                this.rememberConversationSelection(conversationId, firstWithAssistant.assistantId, this.selectedMention);
            }
        } catch (err) {
            console.warn('[NebimAiChat] Sohbetin asistanı bulunamadı:', err);
        }
    }

    private rememberConversationSelection(conversationId: string, assistantId: string, mention: MentionChip | null): void {
        try {
            const all = this.readAllConversationSelections();
            delete all[conversationId];
            all[conversationId] = { assistantId, mention: mention ? { ...mention } : null };
            // En eski kayitlar atilarak depolama sinirli tutulur
            const keys = Object.keys(all);
            for (const key of keys.slice(0, Math.max(0, keys.length - CONVERSATION_SELECTION_LIMIT))) delete all[key];
            localStorage.setItem(CONVERSATION_SELECTION_KEY, JSON.stringify(all));
        } catch {
            // localStorage kullanilamiyorsa AI loglarindan geri yuklenir
        }
    }

    private readConversationSelection(conversationId: string): StoredConversationSelection | null {
        return this.readAllConversationSelections()[conversationId] ?? null;
    }

    private readAllConversationSelections(): Record<string, StoredConversationSelection> {
        try {
            const raw = localStorage.getItem(CONVERSATION_SELECTION_KEY);
            const parsed = raw ? JSON.parse(raw) : {};
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
            return {};
        }
    }

    // ── Veri yükleme ─────────────────────────────────────────────────

    async loadConversationList(): Promise<void> {
        const version = ++this.sidebarListVersion;
        try {
            const page = await this.fetchConversationPage(1);
            if (version !== this.sidebarListVersion) return;

            page.conversations.sort((a, b) => this.toEpoch(b.lastMessageDate) - this.toEpoch(a.lastMessageDate));

            this.sidebarChats = page.conversations.map((conversation, index) => this.toSidebarEntry(conversation, index));
            this.sidebarCurrentPage = 1;
            this.hasMoreSidebarChats = this.sidebarChats.length < page.totalCount;
        } catch (err) {
            console.warn('[NebimAiChat] Sohbet listesi yüklenemedi:', err);
            if (version !== this.sidebarListVersion) return;
            this.sidebarChats = [];
            this.hasMoreSidebarChats = false;
        }
    }

    async onLoadMoreChats(): Promise<void> {
        if (!this.hasMoreSidebarChats || this.isLoadingMoreChats) return;

        const version = this.sidebarListVersion;
        this.isLoadingMoreChats = true;
        try {
            const nextPage = this.sidebarCurrentPage + 1;
            const page = await this.fetchConversationPage(nextPage);
            if (version !== this.sidebarListVersion) return;

            if (!page.conversations.length) {
                this.hasMoreSidebarChats = false;
                return;
            }

            const existingIds = new Set(this.sidebarChats.map((chat) => chat.id));
            const appended = page.conversations
                .filter((conversation) => !existingIds.has(conversation.id))
                .map((conversation, index) => this.toSidebarEntry(conversation, this.sidebarChats.length + index));

            this.sidebarChats = [...this.sidebarChats, ...appended];
            this.sidebarCurrentPage = nextPage;
            this.hasMoreSidebarChats = this.sidebarChats.length < page.totalCount;
        } catch (err) {
            console.warn('[NebimAiChat] Ek sohbetler yüklenemedi:', err);
        } finally {
            this.isLoadingMoreChats = false;
        }
    }

    private async fetchConversationPage(page: number): Promise<ConversationListResponse> {
        const response = await this.conversationsService.getList('messages', page, SIDEBAR_PAGE_SIZE);
        const conversations = this.extractArray<ConversationHeader>(this.readField(response.data, 'conversations'));
        const totalCount = this.toFiniteNumber(response.dataCount)
            || this.toFiniteNumber(this.readField(response.data, 'totalCount'))
            || conversations.length;

        return { conversations, totalCount };
    }

    private async loadAssistants(): Promise<void> {
        try {
            const response = await this.aiProvidersService.getAssistantsPaged({
                pageNumber: 1,
                pageSize: 1000,
                companyId: this.getCompanyId() ?? '',
            });

            this.assistants = this.extractArray<AiAssistant>(response.data)
                .filter((assistant) => !assistant.isBlocked)
                .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

            if (!this.selectedAssistantId && this.assistants.length) {
                this.selectedAssistantId = this.assistants[0].id;
            }
        } catch (err) {
            console.warn('[NebimAiChat] Asistan listesi yüklenemedi:', err);
            this.assistants = [];
            this.selectedAssistantId = '';
        }
    }

    private async loadExtensionShortcuts(): Promise<void> {
        const companyId = this.getCompanyId();
        if (!companyId) return;

        this.isLoadingExtensions = true;
        try {
            const [companyExtensionsResponse, definitionsResponse] = await Promise.all([
                this.extensionManagementService.getCompanyExtensions(companyId),
                this.extensionManagementService.getExtensionDefinitions(),
            ]);

            const definitions = new Map(
                this.extractArray<ExtensionDefinition>(definitionsResponse.data)
                    .filter((definition) => definition.isActive && !definition.isBlocked && definition.mention?.trim())
                    .map((definition) => [definition.id, definition]),
            );

            this.extensionShortcuts = this.extractArray<CompanyExtension>(companyExtensionsResponse.data)
                .filter((item) => !item.isBlocked)
                .flatMap((item) => {
                    const definition = definitions.get(item.extensionId);
                    return definition ? [this.toExtensionShortcut(item, definition)] : [];
                })
                .sort((a, b) => a.order - b.order);
        } catch (err) {
            console.error('[NebimAiChat] Eklenti kısayolları yüklenemedi:', err);
            this.extensionShortcuts = [];
        } finally {
            this.isLoadingExtensions = false;
        }

        this.enabledExtensionShortcuts = this.extensionShortcuts.filter((item) => item.isEnabled);
        this.extensionGroups = this.groupByCategory(this.enabledExtensionShortcuts);
    }

    private toExtensionShortcut(item: CompanyExtension, definition: ExtensionDefinition): ExtensionShortcut {
        const mention = this.normalizeMention(definition.mention);
        const content = EXTENSION_CONTENT[this.toLookupKey(mention.slice(1))]
            ?? EXTENSION_CONTENT[this.toLookupKey(definition.name)];

        return {
            id: item.extensionId,
            name: content?.title || definition.name || item.extensionName || 'Eklenti',
            mention,
            photoUrl: definition.photoUrl || item.photoUrl,
            category: content?.category || definition.categoryName?.trim() || definition.categoryCode?.trim() || 'Genel',
            subtitle: content?.subtitle || 'Bu eklentiyle ilgili sorularını etiket ekleyerek sorabilirsin.',
            order: content?.order ?? 99,
            isEnabled: item.isEnabled,
        };
    }

    private groupByCategory(items: ExtensionShortcut[]): ExtensionShortcutGroup[] {
        const groups = new Map<string, ExtensionShortcut[]>();
        for (const item of items) {
            groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
        }

        let startIndex = 0;
        return [...groups.entries()]
            .sort(([left], [right]) => left.localeCompare(right, 'tr-TR'))
            .map(([category, groupItems]) => {
                const group = { category, items: groupItems, startIndex };
                startIndex += groupItems.length;
                return group;
            });
    }

    private getCompanyId(): string | null {
        const candidates = [this.authState.profile?.companyId, this.readStoredProfile()?.companyId];
        return candidates.find((id): id is string => !!id && GUID_PATTERN.test(id) && id !== EMPTY_GUID) ?? null;
    }

    private readStoredProfile(): StoredUserProfile | null {
        try {
            const parsed: unknown = JSON.parse(localStorage.getItem('userProfile') || 'null');
            return parsed && typeof parsed === 'object' ? parsed as StoredUserProfile : null;
        } catch {
            return null;
        }
    }

    // ── API yanıtı → UI modeli ───────────────────────────────────────

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response as T[];
        if (!response || typeof response !== 'object') return [];

        const record = response as Record<string, unknown>;
        if (Array.isArray(record['$values'])) return record['$values'] as T[];
        if (Array.isArray(record['items'])) return record['items'] as T[];

        for (const key of ['data', 'result']) {
            const value = record[key];
            if (Array.isArray(value)) return value as T[];
            if (value && typeof value === 'object') return [value as T];
        }

        return [];
    }

    /** Sohbet listesi v1.yaml'da tanimli degil; alanlar camelCase veya PascalCase gelebilir. */
    private readField(source: unknown, key: string): unknown {
        if (!source || typeof source !== 'object') return undefined;
        const record = source as Record<string, unknown>;
        return record[key] ?? record[key.charAt(0).toUpperCase() + key.slice(1)];
    }

    private readText(source: unknown, ...keys: string[]): string {
        for (const key of keys) {
            const value = this.readField(source, key);
            if (typeof value === 'string' && value.trim()) return value.trim();
        }
        return '';
    }

    private toFiniteNumber(value: unknown): number {
        const parsed = typeof value === 'string' && value.trim() ? Number(value) : value;
        return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
    }

    private toSidebarEntry(conversation: ConversationHeader, index: number): ChatHistoryEntry {
        const preview = this.readText(conversation, 'lastMessage', 'lastMessages');
        const rawDate = this.readText(conversation, 'lastMessageDate', 'updatedDate', 'createdDate');
        const date = new Date(rawDate);

        return {
            id: conversation.id,
            label: this.readText(conversation, 'customerName') || preview || `Sohbet ${index + 1}`,
            preview,
            dateText: rawDate && !Number.isNaN(date.getTime())
                ? (this.isToday(date)
                    ? date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                    : date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }))
                : '',
        };
    }

    private mapConversationMessages(response: ConversationMessagesResponse): UiChatMessage[] {
        return this.extractArray<ChatMessage>(response.messages)
            .map((message) => this.toUiChatMessage(message))
            .filter((message) => message.content || message.mentions.length || message.blocks.length);
    }

    private toUiChatMessage(message: ChatMessage): UiChatMessage {
        const role = this.resolveRole(message.source);
        const text = (message.text ?? '').trim();
        // Kullanici mesajindaki etiket chip olarak gosterilir; metinde tekrar edilmez.
        const mentions = role === 'user' ? this.extractMentions(text) : [];
        const id = message.id || this.uid();

        const uiMessage: UiChatMessage = {
            id,
            key: id,
            role,
            content: mentions.length ? this.stripMentions(text) : text,
            createdDate: message.createdDate ?? null,
            timeText: this.formatMessageTime(message.createdDate),
            mentions,
            blocks: this.normalizeBlocks(message.blocks, message.imageUrl),
            aiImageUrl: message.hasImage && message.aiImageUrl ? message.aiImageUrl : null,
            excelUrl: message.hasExcel && message.excelUrl ? message.excelUrl : null,
            shareUrl: null,
            isLiked: typeof message.isLiked === 'boolean' ? message.isLiked : null,
            isReactionSaving: false,
            isPending: false,
            animate: false,
        };

        if (role === 'assistant') {
            uiMessage.shareUrl = this.buildWhatsAppShareUrl(uiMessage);
        }

        return uiMessage;
    }

    private resolveRole(source: string | null | undefined): 'user' | 'assistant' {
        const normalized = (source ?? '').toLowerCase();
        return normalized.includes('assistant') || normalized.includes('ai') ? 'assistant' : 'user';
    }

    private extractMentions(text: string): MentionChip[] {
        const tokens = new Set([...text.matchAll(MENTION_TOKEN_PATTERN)].map((match) => this.normalizeMention(match[2])));

        return [...tokens].map((mention) => {
            const shortcut = this.findShortcut(mention);
            return shortcut ? this.toChip(shortcut) : { id: mention, name: mention.slice(1), mention };
        });
    }

    private stripMentions(text: string): string {
        return this.removeMentionTokens(text, 0, () => true).text.trim();
    }

    private normalizeBlocks(blocks: AiChatContentBlock[] | null | undefined, fallbackImageUrl?: string | null): UiChatBlock[] {
        const normalized = (Array.isArray(blocks) ? blocks : [])
            .filter((block) => SUPPORTED_BLOCK_TYPES.has(block?.type))
            .map((block, index) => ({ block, order: Number.isFinite(block.order) ? block.order : index }))
            .sort((left, right) => left.order - right.order)
            .map(({ block }) => this.toUiBlock(block))
            .filter((block) => this.hasBlockContent(block));

        if (!normalized.length && fallbackImageUrl?.trim()) {
            return [{
                type: 'image',
                title: null,
                text: null,
                table: null,
                images: [{ url: fallbackImageUrl, caption: null, alt: null }],
                orders: [],
            }];
        }

        return normalized;
    }

    private toUiBlock(block: AiChatContentBlock): UiChatBlock {
        return {
            type: block.type,
            title: this.normalizeBlockTitle(block.title),
            text: block.text?.trim() ? block.text : null,
            table: this.toUiTable(block.table),
            images: (block.images ?? []).filter((image) => typeof image?.url === 'string' && image.url.trim()),
            orders: (block.orders ?? [])
                .filter((order) => !!order && typeof order === 'object')
                .map((order) => ({ ...order, items: (order.items ?? []).filter(Boolean) })),
        };
    }

    private hasBlockContent(block: UiChatBlock): boolean {
        switch (block.type) {
            case 'text': return !!block.text;
            case 'table': return !!block.table;
            case 'order': return block.orders.length > 0;
            default: return block.images.length > 0;
        }
    }

    private normalizeBlockTitle(title: string | null | undefined): string | null {
        const normalized = (title || '').trim();
        if (!normalized) return null;

        // Tool adlari Ingilizce; tr-TR kucuk harf 'I' → 'ı' yapip eslesmeyi bozar.
        const lowered = normalized.toLowerCase();
        const isTechnicalToolTitle =
            lowered.startsWith('func.tool')
            || lowered.startsWith('tool.')
            || lowered.startsWith('function.')
            || /^([a-z0-9]+_)?get_[a-z0-9_]+$/i.test(normalized);

        return isTechnicalToolTitle ? null : normalized;
    }

    private toUiTable(table: AiChatTableData | null | undefined): UiTable | null {
        if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) return null;

        const columns = table.columns.filter((column) => typeof column === 'string' && column.trim());
        const rows = table.rows.filter((row) => !!row && typeof row === 'object');
        if (!columns.length || !rows.length) return null;

        return {
            columns,
            rows: rows.map((row) => columns.map((column) => this.toUiTableCell(row[column], column))),
            isTruncated: Boolean(table.isTruncated),
        };
    }

    private toUiTableCell(raw: unknown, column: string): UiTableCell {
        const value = raw === null || raw === undefined ? '-' : String(raw);
        const link = this.toLink(value);
        const columnKey = this.toLookupKey(column);

        return {
            value,
            link,
            isImage: !!link && (this.isImageUrl(link) || IMAGE_COLUMN_HINTS.some((hint) => columnKey.includes(hint))),
            linkLabel: columnKey.includes('invoice') || columnKey.includes('pdf')
                ? 'PDF Aç'
                : columnKey.includes('excel') ? 'Excel Aç' : 'Linki Aç',
        };
    }

    private toLink(rawValue: string): string | null {
        const value = rawValue.trim();
        if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
        if (/^www\./i.test(value)) return `https://${value}`;
        return null;
    }

    private isImageUrl(url: string): boolean {
        try {
            return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(new URL(url).pathname);
        } catch {
            return false;
        }
    }

    private buildWhatsAppShareUrl(message: UiChatMessage): string | null {
        const parts = new Set<string>();
        if (message.content) parts.add(message.content);

        for (const block of message.blocks) {
            if (block.type === 'text') {
                parts.add((block.text ?? '').trim());
            } else if (block.type === 'table' && block.table) {
                parts.add(this.serializeTableForShare(block.title, block.table));
            } else if (block.type === 'order') {
                parts.add(block.orders.map((order) => this.describeOrder(order)).join('\n'));
            } else {
                parts.add(block.images.map((image, index) => `${block.title || 'Görsel'} ${index + 1}: ${image.url}`).join('\n'));
            }
        }

        if (message.excelUrl) parts.add(`Excel: ${message.excelUrl}`);
        if (message.aiImageUrl) parts.add(`Görsel: ${message.aiImageUrl}`);

        const text = [...parts].filter(Boolean).join('\n\n');
        return text ? `https://wa.me/?text=${encodeURIComponent(text)}` : null;
    }

    private serializeTableForShare(title: string | null, table: UiTable): string {
        const lines = [
            ...(title ? [title] : []),
            table.columns.join(' | '),
            ...table.rows.map((row) => row.map((cell) => cell.value).join(' | ')),
        ];

        if (table.isTruncated) {
            lines.push('Not: Tablo kısaltılmış veridir.');
        }

        return lines.join('\n');
    }

    private describeOrder(order: AiChatOrderData): string {
        const total = order.totalPrice !== null ? `${order.totalPrice} ${order.currency || ''}`.trim() : null;
        return [`Sipariş #${order.orderNumber || '-'}`, order.status, total].filter(Boolean).join(' · ');
    }

    // ── Reaksiyonlar ─────────────────────────────────────────────────

    async toggleReaction(message: UiChatMessage, isLiked: boolean): Promise<void> {
        if (message.isReactionSaving) return;

        // Ayni reaksiyona tekrar basilirsa reaksiyon kaldirilir
        if (message.isLiked === isLiked) {
            await this.saveReaction(message, { isLiked: null });
        } else if (isLiked) {
            await this.saveReaction(message, { isLiked: true });
        } else {
            this.openReactionModal(message);
        }
    }

    selectDislikeReason(reason: string): void {
        // Secili nedene tekrar basilirsa secim kaldirilir
        this.reactionForm.reason = this.reactionForm.reason === reason ? '' : reason;
    }

    closeReactionModal(): void {
        this.showReactionModal = false;
        this.reactionTarget = null;
    }

    async submitReactionModal(): Promise<void> {
        const message = this.reactionTarget;
        if (!message) return;

        const request: ConversationMessageReactionRequest = {
            isLiked: false,
            reason: this.reactionForm.reason || null,
            description: this.reactionForm.description.trim() || null,
        };
        this.closeReactionModal();
        await this.saveReaction(message, request);
    }

    private openReactionModal(message: UiChatMessage): void {
        // Mobilde acik klavye diyalogun altini kapatmasin; odak diyaloga tasinir.
        (document.activeElement as HTMLElement | null)?.blur();
        this.reactionTarget = message;
        this.reactionForm = { reason: '', description: '' };
        this.showReactionModal = true;
        setTimeout(() => this.hostRef.nativeElement.querySelector<HTMLElement>('.nac-modal .btn')?.focus());
    }

    private async saveReaction(message: UiChatMessage, request: ConversationMessageReactionRequest): Promise<void> {
        const conversationId = this.activeConversationId;
        // Polling mesaj listesini yenilemis ya da sohbet degismis olabilir; ekrandaki guncel nesne uzerinde calis.
        const target = this.messages.find((item) => item.id === message.id);
        if (!conversationId || !target) return;

        const previous = target.isLiked;
        target.isLiked = request.isLiked;
        target.isReactionSaving = true;

        try {
            await this.conversationsService.setMessageReaction(conversationId, target.id, request);
        } catch (err) {
            target.isLiked = previous;
            console.error('[NebimAiChat] Mesaj reaksiyonu güncellenemedi:', err);
            this.errorMessage = 'Geri bildirimin kaydedilemedi. Lütfen tekrar deneyin.';
        } finally {
            target.isReactionSaving = false;
        }
    }

    // ── Yardımcılar ──────────────────────────────────────────────────

    private formatMessageTime(value: string | Date | null | undefined): string {
        const date = value instanceof Date ? value : new Date(value ?? '');
        if (Number.isNaN(date.getTime())) return '';

        const time = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        return this.isToday(date)
            ? time
            : `${date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} ${time}`;
    }

    private isToday(date: Date): boolean {
        return date.toDateString() === new Date().toDateString();
    }

    /** Saat dilimi bilgisi olmayan tarih UTC de olabilecegi icin iki yorumdan biri yeterlidir. */
    private isRecent(value: string | null | undefined): boolean {
        if (!value) return false;
        const hasZone = /(z|[+-]\d{2}:?\d{2})$/i.test(value);
        const candidates = [new Date(value).getTime(), hasZone ? NaN : new Date(`${value}Z`).getTime()];
        return candidates.some((time) => Number.isFinite(time) && Math.abs(Date.now() - time) < REPLY_WAIT_WINDOW_MS);
    }

    private toEpoch(dateValue?: string): number {
        const time = dateValue ? new Date(dateValue).getTime() : 0;
        return Number.isFinite(time) ? time : 0;
    }

    private collapseWhitespace(value: string): string {
        return value.replace(/\s+/g, ' ').trim();
    }

    private playTypingSound(event: KeyboardEvent): void {
        if (!this.soundEnabled || event.ctrlKey || event.metaKey || event.altKey) return;

        const key = event.key;
        const isTypingKey = key.length === 1 || key === 'Backspace' || key === 'Delete' || key === 'Enter';
        const now = Date.now();
        if (!isTypingKey || now - this.lastKeyboardSoundAt < 45) return;

        this.lastKeyboardSoundAt = now;
        this.playKeyboardSound();
    }

    private playKeyboardSound(): void {
        if (!this.soundEnabled) return;

        this.keyboardSound.currentTime = 0;
        // Tarayici otomatik oynatmayi engelleyebilir; sessizce yoksay.
        this.keyboardSound.play()?.catch(() => undefined);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private uid(): string {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
}

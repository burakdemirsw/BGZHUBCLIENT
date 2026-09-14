import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatHistoryEntry, SidebarComponent } from '../sidebar/sidebar';
import { ConversationsService } from '@/app/core/services/conversations.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { AiAssistant } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { CompanyExtension } from '@/app/core/models/extension/company-extension.models';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import {
    AiChatContentBlock,
    AiChatImageData,
    AiChatResponse,
    AiChatResponseType,
    AiChatTableData,
    AiChatToolPayload,
    ConversationReplyResponse,
    ConversationMessageReactionRequest,
    ConversationHeader,
    ChatMessage,
    ConversationMessagesResponse,
    ConversationReplyRequest,
    CreateTestConversationRequest,
} from '@/app/core/models/conversation/conversation.models';

interface UiChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
    mentions?: MentionChipItem[];
    blocks?: AiChatContentBlock[];
    isError?: boolean;
    hasImage?: boolean;
    aiImageUrl?: string | null;
    hasExcel?: boolean;
    excelUrl?: string | null;
    isLiked?: boolean | null;
    isReactionSaving?: boolean;
}

interface ConversationApiMessage {
    id?: string;
    conversationId?: string | null;
    source?: string | null;
    text?: string | null;
    imageUrl?: string | null;
    messageText?: string | null;
    messageContent?: string | null;
    createdDate?: string | null;
    responseType?: AiChatResponseType | string | null;
    blocks?: AiChatContentBlock[] | null;
    toolPayloads?: AiChatToolPayload[] | null;
    hasImage?: boolean | null;
    aiImageUrl?: string | null;
    hasExcel?: boolean | null;
    excelUrl?: string | null;
    isLiked?: boolean | null;
}

interface ConversationReplyResponseShape {
    conversation?: ConversationMessagesResponse | null;
    Conversation?: ConversationMessagesResponse | null;
    aiResponse?: AiChatResponse | null;
    AiResponse?: AiChatResponse | null;
}

interface CreateTestConversationResponse {
    conversationId?: string;
}

interface StoredUserProfile {
    userId?: string;
    companyId?: string;
    name?: string;
    lastName?: string;
}

interface ConversationPageResult {
    conversations: ConversationHeader[];
    totalCount: number;
}

interface ActiveExtensionShortcut {
    id: string;
    name: string;
    mention: string;
    category: string;
    subtitle: string;
    prompt: string;
    isEnabled: boolean;
    photoUrl?: string;
}

interface MentionChipItem {
    id: string;
    name: string;
    mention: string;
    photoUrl?: string;
}

@Component({
    selector: 'app-nebim-ai-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarComponent],
    templateUrl: './nebim-ai-chat.html',
    styleUrl: './nebim-ai-chat.scss'
})
export class NebimAiChatPage implements OnInit, AfterViewChecked, OnDestroy {
    @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;
    @ViewChild('textArea') textArea?: ElementRef<HTMLTextAreaElement>;
    @ViewChild(SidebarComponent) sidebar?: SidebarComponent;

    messages: UiChatMessage[] = [];
    sidebarChats: ChatHistoryEntry[] = [];
    hasMoreSidebarChats = false;
    isLoadingMoreChats = false;

    input = '';
    assistants: AiAssistant[] = [];
    selectedAssistantId = '';
    assistantMenuOpen = false;
    extensionMenuOpen = false;
    mentionAutocompleteQuery: string | null = null;
    extensionMenuFilterText = '';
    isLoadingExtensions = false;
    activeExtensionShortcuts: ActiveExtensionShortcut[] = [];
    selectedMentionChips: MentionChipItem[] = [];
    isSending = false;
    isLoadingThread = false;
    sidebarCollapsed = false;
    sidebarMobileOpen = false;

    activeConversationId: string | null = null;
    errorMessage = '';

    private shouldScroll = false;
    /**
     * Bu sayfadan yeni baslatilan sohbetin id'si. Route degisimi tetiklendiginde
     * backend henuz ilk mesaji kaydetmedigi icin getMessages bos donuyor ve
     * optimistic mesajlar siliniyordu. Bu id icin route kaynakli yukleme atlanir.
     */
    private locallyStartedConversationId: string | null = null;
    private assistantWaitConversationId: string | null = null;
    private extensionMenuOpenedByMention = false;
    private sidebarOpenedManually = false;
    private sidebarCurrentPage = 1;
    private readonly sidebarPageSize = 20;
    private routeConversationSub: Subscription | null = null;
    private viewportSyncCleanup: (() => void) | null = null;

    private readonly extensionContentByKey: Record<string, { category: string; title: string; subtitle: string; prompt: string; order: number }> = {
        siparis: {
            category: 'Operasyon',
            title: 'Siparis',
            subtitle: 'Siparis durumu, hazirlik adimlari ve iptal surecini hizlica sorgula.',
            prompt: 'Siparis durumunu ve son islem adimlarini getir.',
            order: 1,
        },
        fatura: {
            category: 'Finans',
            title: 'Fatura',
            subtitle: 'Faturalandirma, iade faturalari ve tahsilat kalemlerini incele.',
            prompt: 'Fatura ozetini ve acik kalan kayitlari listeler misin?',
            order: 2,
        },
        sevkiyat: {
            category: 'Lojistik',
            title: 'Sevkiyat',
            subtitle: 'Kargo hazirlik, teslimat ve gecikme nedenlerini tek noktadan gor.',
            prompt: 'Sevkiyat durumunu ve teslimat performansini ozetle.',
            order: 3,
        },
        transfer: {
            category: 'Depo',
            title: 'Transfer',
            subtitle: 'Depolar arasi transfer talepleri ve onay bekleyen hareketleri yonet.',
            prompt: 'Transfer taleplerini ve bekleyen onaylari getir.',
            order: 4,
        },
        musteri: {
            category: 'CRM',
            title: 'Musteri',
            subtitle: 'Musteri gecmisi, iletisim kayitlari ve son alisveris trendini analiz et.',
            prompt: 'Musteri gecmisini ve son etkilesim notlarini goster.',
            order: 5,
        },
        urun: {
            category: 'Katalog',
            title: 'Urun',
            subtitle: 'Urun karti detaylari, varyant bilgileri ve katalog metinlerini sorgula.',
            prompt: 'Urun bilgilerini ve varyant detaylarini listeler misin?',
            order: 6,
        },
        stok: {
            category: 'Envanter',
            title: 'Stok',
            subtitle: 'Anlik stok, kritik seviye uyarilari ve devir hizini karsilastir.',
            prompt: 'Stok seviyelerini ve kritik urunleri raporla.',
            order: 7,
        },
        wms: {
            category: 'Warehouse',
            title: 'WMS',
            subtitle: 'Toplama, yerlestirme, sayim ve lokasyon verimliligini takip et.',
            prompt: 'WMS operasyon durumunu ve lokasyon verimliligini paylas.',
            order: 8,
        },
    };

    constructor(
        private conversationsService: ConversationsService,
        private aiProvidersService: AiProvidersService,
        private authState: AuthStateService,
        private extensionManagementService: ExtensionManagementService,
        private router: Router,
        private route: ActivatedRoute,
        private hostRef: ElementRef<HTMLElement>,
    ) {}
   
    async ngOnInit(): Promise<void> {
        this.startViewportSync();

        await Promise.all([
            this.loadSidebar(),
            this.loadConversationList(),
            this.loadAssistants(),
            this.loadActiveExtensionShortcuts(),
        ]);

        await this.syncConversationFromRoute(this.route.snapshot.paramMap.get('conversationId'));
        this.routeConversationSub = this.route.paramMap.subscribe((paramMap) => {
            void this.syncConversationFromRoute(paramMap.get('conversationId'));
        });

        // Ensure initial render lands at the latest message on page open.
        this.shouldScroll = true;
        setTimeout(() => {
            this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'auto', block: 'end' });
        }, 0);
    }   

    ngAfterViewChecked(): void {
        if (this.shouldScroll) {
            this.shouldScroll = false;
            this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    }

    ngOnDestroy(): void {
        this.routeConversationSub?.unsubscribe();
        this.routeConversationSub = null;
        this.viewportSyncCleanup?.();
        this.viewportSyncCleanup = null;
    }

    /**
     * Mobil tarayicılarda yazılım klavyesi acıldıgında layout viewport degismedigi icin
     * sabit konumlu chat kabugu klavyenin altında kalıyor. Gercek gorunur viewport
     * olculeri CSS degiskenlerine yazılarak composer her zaman gorunur tutulur.
     */
    private startViewportSync(): void {
        if (typeof window === 'undefined') return;

        const visualViewport = window.visualViewport ?? null;
        const applyViewportMetrics = () => {
            const height = Math.round(visualViewport?.height ?? window.innerHeight);
            const offsetTop = Math.round(visualViewport?.offsetTop ?? 0);
            const hostStyle = this.hostRef.nativeElement.style;
            hostStyle.setProperty('--nac-viewport-height', `${height}px`);
            hostStyle.setProperty('--nac-viewport-offset', `${offsetTop}px`);
        };

        applyViewportMetrics();

        if (visualViewport) {
            visualViewport.addEventListener('resize', applyViewportMetrics);
            visualViewport.addEventListener('scroll', applyViewportMetrics);
            this.viewportSyncCleanup = () => {
                visualViewport.removeEventListener('resize', applyViewportMetrics);
                visualViewport.removeEventListener('scroll', applyViewportMetrics);
            };
            return;
        }

        window.addEventListener('resize', applyViewportMetrics);
        window.addEventListener('orientationchange', applyViewportMetrics);
        this.viewportSyncCleanup = () => {
            window.removeEventListener('resize', applyViewportMetrics);
            window.removeEventListener('orientationchange', applyViewportMetrics);
        };
    }
  
    private isMobileViewport(): boolean {
        return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    }

    onComposerFocus(): void {
        // Klavye acilma animasyonu bittikten sonra son mesaja kaydir.
        setTimeout(() => {
            this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }, 300);
    }

    get selectedAssistantLabel(): string {
        const selectedAssistant = this.assistants.find((assistant) => assistant.id === this.selectedAssistantId);
        if (selectedAssistant?.name?.trim()) {
            return selectedAssistant.name.trim();
        }

        if (this.assistants.length > 0) {
            return this.assistants[0].name?.trim() || 'Asistan sec';
        }

        return 'Asistan sec';
    }

    toggleAssistantMenu(): void {
        this.assistantMenuOpen = !this.assistantMenuOpen;
    }

    selectAssistant(assistantId: string): void {  
        this.selectedAssistantId = assistantId;
        this.assistantMenuOpen = false;
    }

    onExtensionShortcutClick(): void {
        if (this.isLoadingExtensions) return;

        const enabledShortcuts = this.getEnabledExtensionShortcuts();
        if (!enabledShortcuts.length) {
            this.errorMessage = 'Aktif extension bulunamadi.';
            return;
        }

        if (enabledShortcuts.length === 1) {
            this.insertMentionToInput(enabledShortcuts[0].mention, enabledShortcuts[0]);
            return;
        }

        this.extensionMenuOpen = !this.extensionMenuOpen;
        if (this.extensionMenuOpen) {
            this.mentionAutocompleteQuery = null;
            this.extensionMenuFilterText = '';
            this.extensionMenuOpenedByMention = false;
            this.assistantMenuOpen = false;
        }
    }

    selectExtensionShortcut(shortcut: ActiveExtensionShortcut): void {
        if (!shortcut.isEnabled) {
            this.errorMessage = 'Bu extension pasif durumda oldugu icin secilemez.';
            return;
        }
        this.insertMentionToInput(shortcut.mention, shortcut);
        this.extensionMenuOpen = false;
        this.extensionMenuOpenedByMention = false;
    }

    useExtensionShortcutCard(shortcut: ActiveExtensionShortcut): void {
        if (!shortcut.isEnabled) {
            this.errorMessage = `${shortcut.name} su anda pasif durumda.`;
            return;
        }

        this.insertMentionToInput(shortcut.mention, shortcut);
        if (!this.input.includes(shortcut.prompt)) {
            const base = this.input.trimEnd();
            this.input = `${base} ${shortcut.prompt}`.trim();
        }

        setTimeout(() => {
            this.textArea?.nativeElement.focus();
            this.autoResize();
        }, 0);
    }

    hasExtensionShortcuts(): boolean {
        return this.getEnabledExtensionShortcuts().length > 0;
    }

    isSingleExtensionShortcut(): boolean {
        return this.getEnabledExtensionShortcuts().length === 1;
    }

    private getEnabledExtensionShortcuts(): ActiveExtensionShortcut[] {
        return this.activeExtensionShortcuts.filter(item => item.isEnabled);
    }

    get filteredExtensionShortcuts(): ActiveExtensionShortcut[] {
        const enabledShortcuts = this.getEnabledExtensionShortcuts();
        const autocompleteQuery = this.mentionAutocompleteQuery;
        const manualFilterQuery = this.toLookupKey(this.extensionMenuFilterText);
        const query = autocompleteQuery !== null ? autocompleteQuery : manualFilterQuery;

        if (query === null) {
            return enabledShortcuts;
        }

        if (!query) {
            return enabledShortcuts;
        }

        return enabledShortcuts.filter(item => {
            const mentionKey = this.toLookupKey((item.mention || '').replace('@', ''));
            const nameKey = this.toLookupKey(item.name || '');
            return mentionKey.includes(query) || nameKey.includes(query);
        });
    }

    onExtensionMenuFilterInput(): void {
        if (!this.extensionMenuOpen) {
            return;
        }

        this.mentionAutocompleteQuery = null;
    }

    private insertMentionToInput(mention: string, shortcut?: ActiveExtensionShortcut): void {
        const token = this.normalizeMention(mention);
        if (!token) {
            this.errorMessage = 'Bu extension icin mention tanimi bulunamadi.';
            return;
        }

        if (!shortcut) {
            this.errorMessage = 'Mention secimi icin extension bulunamadi.';
            return;
        }

        if (this.selectedMentionChips.some(item => item.id === shortcut.id || item.mention === token)) {
            this.errorMessage = `${token} zaten secili.`;
            return;
        }

        this.selectedMentionChips = [
            ...this.selectedMentionChips,
            {
                id: shortcut.id,
                name: shortcut.name,
                mention: token,
                photoUrl: shortcut.photoUrl,
            },
        ];
        this.errorMessage = '';

        setTimeout(() => {
            this.textArea?.nativeElement.focus();
            this.autoResize();
        }, 0);
    }

    private normalizeMention(mention: string | null | undefined): string {
        const raw = (mention || '').trim();
        if (!raw) return '';
        return raw.startsWith('@') ? raw : `@${raw}`;
    }

    removeMentionChip(chip: MentionChipItem): void {
        this.selectedMentionChips = this.selectedMentionChips.filter(item => item.id !== chip.id);
        this.autoResize();
    }

    private getSelectedMentionTokens(): string[] {
        return Array.from(new Set(this.selectedMentionChips.map(item => this.normalizeMention(item.mention)).filter(Boolean)));
    }

    isAssistantSelected(assistantId: string): boolean {
        return this.selectedAssistantId === assistantId;
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement | null;
        if (!target) return;

        if (this.assistantMenuOpen && !target.closest('.nac-assistant-picker')) {
            this.assistantMenuOpen = false;
        }

        if (this.extensionMenuOpen && !target.closest('.nac-extension-picker')) {
            this.extensionMenuOpen = false;
            this.extensionMenuOpenedByMention = false;
            this.mentionAutocompleteQuery = null;
        }
    }

    private async loadActiveExtensionShortcuts(): Promise<void> {
        const companyId = this.getCompanyId();
        if (!companyId) {
            this.activeExtensionShortcuts = [];
            return;
        }

        this.isLoadingExtensions = true;
        try {
            const [companyExtensionsResponse, definitionsResponse] = await Promise.all([
                this.extensionManagementService.getCompanyExtensions(companyId),
                this.extensionManagementService.getExtensionDefinitions(),
            ]);

            const companyExtensions = this.extractArray<CompanyExtension>(companyExtensionsResponse?.data)
                .filter(item => !item.isBlocked);
            const definitions = this.extractArray<ExtensionDefinition>(definitionsResponse?.data)
                .filter(item => item.isActive && !item.isBlocked);

            this.activeExtensionShortcuts = companyExtensions
                .map(item => {
                    const definition = definitions.find(def => def.id === item.extensionId);
                    if (!definition?.mention) return null;

                    const content = this.getExtensionContent(definition.name, definition.mention);

                    return {
                        id: item.extensionId,
                        name: content.title || definition.name || item.extensionName || 'Extension',
                        mention: definition.mention,
                        category: content.category,
                        subtitle: content.subtitle,
                        prompt: content.prompt,
                        isEnabled: item.isEnabled,
                        photoUrl: definition.photoUrl || item.photoUrl,
                    } as ActiveExtensionShortcut;
                })
                .filter((item): item is ActiveExtensionShortcut => item !== null)
                .sort((a, b) => {
                    if (a.isEnabled !== b.isEnabled) {
                        return a.isEnabled ? -1 : 1;
                    }
                    return this.getContentOrder(a) - this.getContentOrder(b);
                });
        } catch (err) {
            console.error('[NebimAiChat] Extension kisayollari yuklenemedi:', err);
            this.activeExtensionShortcuts = [];
        } finally {
            this.isLoadingExtensions = false;
        }
    }

    private getExtensionContent(name: string | null | undefined, mention: string | null | undefined): { category: string; title: string; subtitle: string; prompt: string; order: number } {
        const mentionKey = this.toLookupKey((mention || '').replace('@', ''));
        const nameKey = this.toLookupKey(name || '');
        return this.extensionContentByKey[mentionKey] || this.extensionContentByKey[nameKey] || {
            category: 'Genel',
            title: name || 'Extension',
            subtitle: 'Bu extension ile ilgili sorularinizi mention ekleyerek sorabilirsiniz.',
            prompt: 'Bu extension ile ilgili guncel bilgileri paylas.',
            order: 99,
        };
    }

    private getContentOrder(item: ActiveExtensionShortcut): number {
        const key = this.toLookupKey((item.mention || '').replace('@', ''));
        return this.extensionContentByKey[key]?.order ?? 99;
    }

    private toLookupKey(value: string): string {
        return (value || '')
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
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

    onComposerTab(event: Event): void {
        const keyboardEvent = event as KeyboardEvent;
        if (!this.extensionMenuOpen || !this.extensionMenuOpenedByMention) {
            return;
        }

        const suggestion = this.filteredExtensionShortcuts[0];
        if (!suggestion) {
            return;
        }

        keyboardEvent.preventDefault();
        this.selectExtensionShortcut(suggestion);
        this.removeCurrentMentionTokenFromInput();
        this.onComposerInput();
    }

    autoResize(): void {
        const el = this.textArea?.nativeElement;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }

    onComposerInput(): void {
        this.autoResize();
        this.updateMentionAutocompleteMenu();

        if (this.input.length > 0 && !this.sidebarOpenedManually && !this.isMobileViewport()) {
            this.sidebarCollapsed = true;
            this.sidebarMobileOpen = false;
        }
    }

    private updateMentionAutocompleteMenu(): void {
        const query = this.extractMentionQueryAtCaret();
        this.mentionAutocompleteQuery = query;

        if (query === null) {
            if (this.extensionMenuOpenedByMention) {
                this.extensionMenuOpen = false;
                this.extensionMenuOpenedByMention = false;
            }
            return;
        }

        const suggestions = this.filteredExtensionShortcuts;
        if (!suggestions.length) {
            if (this.extensionMenuOpenedByMention) {
                this.extensionMenuOpen = false;
                this.extensionMenuOpenedByMention = false;
            }
            return;
        }

        this.extensionMenuOpen = true;
        this.extensionMenuOpenedByMention = true;
        this.assistantMenuOpen = false;
    }

    private extractMentionQueryAtCaret(): string | null {
        const el = this.textArea?.nativeElement;
        const cursor = el?.selectionStart ?? this.input.length;
        const inputBeforeCursor = this.input.slice(0, cursor);
        const match = inputBeforeCursor.match(/(^|\s)@([^\s@]*)$/);

        if (!match) {
            return null;
        }

        return this.toLookupKey(match[2] || '');
    }

    private removeCurrentMentionTokenFromInput(): void {
        const el = this.textArea?.nativeElement;
        const cursor = el?.selectionStart ?? this.input.length;
        const before = this.input.slice(0, cursor);
        const after = this.input.slice(cursor);
        const nextBefore = before.replace(/(^|\s)@[^\s@]*$/, '$1');
        this.input = `${nextBefore}${after}`;

        setTimeout(() => {
            const textArea = this.textArea?.nativeElement;
            if (!textArea) return;
            const nextCursor = nextBefore.length;
            textArea.focus();
            textArea.setSelectionRange(nextCursor, nextCursor);
            this.autoResize();
        }, 0);
    }

    send(): void {
        void this.sendAsync();
    }

    private async sendAsync(): Promise<void> {
        const content = this.input.trim();
        if (!content || this.isSending) return;

        const mentionTokens = this.getSelectedMentionTokens();
        if (!mentionTokens.length) {
            this.errorMessage = 'Mesaj gonderebilmek icin en az bir mention eklemelisiniz (orn: @nebim).';
            return;
        }

        const outgoingContent = `${mentionTokens.join(' ')} ${content}`.trim();

        // 1) Aktif sohbet yoksa yeni sohbet oluştur
        if (!this.activeConversationId) {
            const created = await this.ensureConversation();
            if (!created) return;
            this.activeConversationId = created;
            this.locallyStartedConversationId = created;
            await this.navigateToConversation(created);
        }

        const conversationId = this.activeConversationId!;
        const optimisticMentions = this.selectedMentionChips.map((chip) => ({ ...chip }));

        // 2) UI'a kullanıcı mesajını optimistic ekle
        this.messages = [
            ...this.messages,
            {
                id: this.uid(),
                role: 'user',
                content,
                createdAt: new Date(),
                mentions: optimisticMentions,
            }
        ];
        this.selectedMentionChips = [];
        this.input = '';
        this.isSending = true;
        this.errorMessage = '';
        this.shouldScroll = true;
        setTimeout(() => this.autoResize(), 0);

        try {
            const companyId = this.getCompanyId();
            if (!companyId || !this.isGuid(companyId) || this.isEmptyGuid(companyId)) {
                this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
                return;
            }

            if (!this.isGuid(conversationId) || this.isEmptyGuid(conversationId)) {
                this.errorMessage = 'Geçersiz konuşma kimliği.';
                return;
            }

            // 3) Conversations/{conversationId}/reply ile kullanıcı + AI akışını tek istekte çalıştır
            const replyRequest: ConversationReplyRequest = {
                companyId,
                message: outgoingContent,
                assistantId: this.selectedAssistantId || null,
                file: null,
                fileType: null,
            };
            const replyRes = await this.conversationsService.reply(conversationId, replyRequest);

            // 4) Sohbet listesini yenile
            await this.loadConversationList();

            if (!replyRes.isSuccess) {
                this.errorMessage = 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
                return;
            }

            if (replyRes.data) {
                this.applyConversationReplyResponse(replyRes.data);
            }

            // Backend ilk yaniti asenkron uretebiliyor; F5 gerektirmemesi icin
            // kisa sureli messages polling fallback'i uygula.
            if (this.isAwaitingAssistantReply(this.messages)) {
                await this.waitForAssistantMessage(conversationId);
            }
        } catch (err) {
            console.error('[NebimAiChat] Mesaj gönderilemedi:', err);
            this.errorMessage = 'Mesaj gönderilemedi. Lütfen tekrar deneyin.';
        } finally {
            this.isSending = false;
            this.shouldScroll = true;
        }
    }

    private async ensureConversation(): Promise<string | null> {
        const companyId = this.getCompanyId();
        if (!companyId) {
            this.errorMessage = 'Şirket bilgisi bulunamadı. Lütfen yeniden giriş yapın.';
            return null;
        }
        try {
            const payload: CreateTestConversationRequest = {
                companyId,
                firstName:
                    this.authState.profile?.name ||
                    this.getStoredProfile()?.name ||
                    'Test',
                lastName:
                    this.authState.profile?.surname ||
                    this.getStoredProfile()?.lastName ||
                    'User',
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

    private isGuid(value: string): boolean {
        // Backend .NET Guid parse ile uyumlu: canonical 8-4-4-4-12 hex format.
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
    }

    private isEmptyGuid(value: string): boolean {
        return value.toLowerCase() === '00000000-0000-0000-0000-000000000000';
    }

    private getCompanyId(): string | null {
        const fromAuth = this.authState.profile?.companyId;
        if (fromAuth && this.isGuid(fromAuth) && !this.isEmptyGuid(fromAuth)) {
            return fromAuth;
        }

        const fromProfile = this.getStoredProfile()?.companyId;
        if (fromProfile && this.isGuid(fromProfile) && !this.isEmptyGuid(fromProfile)) {
            return fromProfile;
        }

        return null;
    }

    private getStoredProfile(): StoredUserProfile | null {
        try {
            const raw = localStorage.getItem('userProfile');
            if (!raw) return null;
            const parsed = JSON.parse(raw) as StoredUserProfile;
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    }

    private async loadSidebar(): Promise<void> {
        try {
            await this.conversationsService.getSidebar();
        } catch (err) {
            console.warn('[NebimAiChat] Sidebar yüklenemedi:', err);
        }  
    }

    private async loadAssistants(): Promise<void> {
        try {
            const companyId = this.authState.profile?.companyId || '';
            const response = await this.aiProvidersService.getAssistantsPaged({
                pageNumber: 1,
                pageSize: 1000,
                companyId,
            });

            const list = this.extractArray<AiAssistant>(response?.data)
                .filter((assistant) => !assistant.isBlocked)
                .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

            this.assistants = list;
            if (!this.selectedAssistantId && this.assistants.length > 0) {
                this.selectedAssistantId = this.assistants[0].id;
            }
        } catch (err) {
            console.warn('[NebimAiChat] Asistan listesi yüklenemedi:', err);
            this.assistants = [];
            this.selectedAssistantId = '';
        }
    }

    private async loadConversationList(): Promise<void> {
        try {
            this.sidebarCurrentPage = 1;

            const page = await this.fetchConversationHeadersByType('messages', this.sidebarCurrentPage, this.sidebarPageSize);
            const conversations = page.conversations
                .sort((a, b) => this.toEpoch(b.lastMessageDate) - this.toEpoch(a.lastMessageDate));

            this.sidebarChats = conversations.map((conversation, index) => ({
                id: conversation.id,
                label: this.toConversationLabel(conversation, index),
                preview: this.toConversationPreview(conversation),
                dateText: this.toConversationDateText(conversation),
            }));

            this.hasMoreSidebarChats = this.sidebarChats.length < page.totalCount;
        } catch (err) {
            console.warn('[NebimAiChat] Sohbet listesi yüklenemedi:', err);
            this.sidebarChats = [];
            this.hasMoreSidebarChats = false;
        }
    }

    async reloadConversationList(): Promise<void> {
        await this.loadConversationList();
    }

    private async fetchConversationHeadersByType(type: string, page: number, pageSize: number): Promise<ConversationPageResult> {
        const res = await this.conversationsService.getList(type, page, pageSize);
        const conversations = this.extractConversationHeaders(res.data);
        const totalFromPayload = this.extractConversationTotalCount(res.data);
        const totalCount = this.toFiniteNumber(res.dataCount) || totalFromPayload || conversations.length;

        return {
            conversations,
            totalCount,
        };
    }

    async onLoadMoreChats(): Promise<void> {
        if (!this.hasMoreSidebarChats || this.isLoadingMoreChats) {
            return;
        }

        this.isLoadingMoreChats = true;
        try {
            const nextPage = this.sidebarCurrentPage + 1;
            const page = await this.fetchConversationHeadersByType('messages', nextPage, this.sidebarPageSize);
            if (!page.conversations.length) {
                this.hasMoreSidebarChats = false;
                return;
            }

            const existingIds = new Set(this.sidebarChats.map((chat) => chat.id));
            const appended = page.conversations
                .filter((conversation) => !existingIds.has(conversation.id))
                .map((conversation, index) => ({
                    id: conversation.id,
                    label: this.toConversationLabel(conversation, this.sidebarChats.length + index),
                    preview: this.toConversationPreview(conversation),
                    dateText: this.toConversationDateText(conversation),
                }));

            this.sidebarChats = [...this.sidebarChats, ...appended];
            this.sidebarCurrentPage = nextPage;
            this.hasMoreSidebarChats = this.sidebarChats.length < page.totalCount;
        } catch (err) {
            console.warn('[NebimAiChat] Ek sohbetler yüklenemedi:', err);
        } finally {
            this.isLoadingMoreChats = false;
        }
    }

    private async loadThread(conversationId: string): Promise<void> {
        this.isLoadingThread = true;
        this.errorMessage = '';
        try {
            const res = await this.conversationsService.getMessages(conversationId);

            // Yanit geldiginde kullanici baska bir sohbete gecmis olabilir.
            if (this.activeConversationId !== conversationId) {
                return;
            }

            const loaded = res.data ? this.mapConversationMessages(res.data) : [];

            // Bos yanit gelirse ekrandaki optimistic mesajlari silme.
            if (loaded.length === 0 && this.messages.length > 0) {
                return;
            }

            this.messages = loaded;
            this.shouldScroll = true;

            // Sayfa yenileme gibi durumlarda thread ilk etapta sadece kullanici mesaji
            // donebilir; AI mesaji gelene kadar kisa sureli takip et.
            if (this.isAwaitingAssistantReply(this.messages)) {
                void this.waitForAssistantMessage(conversationId);
            }
        } catch (err) {
            console.error('[NebimAiChat] Thread yüklenemedi:', err);
            this.errorMessage = 'Sohbet mesajları yüklenemedi.';
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
        const rawConversations = record['conversations'] ?? record['Conversations'];
        return this.extractArray<ConversationHeader>(rawConversations);
    }

    private extractConversationTotalCount(response: unknown): number {
        if (!response || typeof response !== 'object') return 0;
        const record = response as Record<string, unknown>;
        const totalRaw = record['totalCount'] ?? record['TotalCount'];
        return this.toFiniteNumber(totalRaw);
    }

    private toFiniteNumber(value: unknown): number {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string' && value.trim()) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        return 0;
    }

    private extractConversationMessages(response: ConversationMessagesResponse | null): ConversationApiMessage[] {
        if (!response || typeof response !== 'object') return [];
        const record = response as unknown as Record<string, unknown>;
        const rawMessages = record['messages'] ?? record['Messages'];
        return this.extractArray<ConversationApiMessage>(rawMessages);
    }

    private extractConversationFromReply(response: ConversationReplyResponse | null): ConversationMessagesResponse | null {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const record = response as unknown as ConversationReplyResponseShape;
        return record.conversation ?? record.Conversation ?? null;
    }

    private extractAiResponse(response: ConversationReplyResponse | null): AiChatResponse | null {
        if (!response || typeof response !== 'object') {
            return null;
        }

        const record = response as unknown as ConversationReplyResponseShape;
        return record.aiResponse ?? record.AiResponse ?? null;
    }

    private resolveRole(message: ConversationApiMessage): 'user' | 'assistant' {
        const source = (message.source ?? '').toLowerCase();
        return source.includes('assistant') || source.includes('ai') ? 'assistant' : 'user';
    }

    private resolveMessageText(message: ConversationApiMessage): string {
        return message.text ?? message.messageText ?? message.messageContent ?? '';
    }

    private normalizeBlocks(blocks: AiChatContentBlock[] | null | undefined): AiChatContentBlock[] {
        if (!Array.isArray(blocks)) {
            return [];
        }

        return blocks
            .filter((block) => this.isSupportedBlockType(block?.type))
            .map((block, index) => ({
                type: block.type,
                title: this.normalizeBlockTitle(block.title),
                order: Number.isFinite(block.order) ? block.order : index,
                text: block.text ?? null,
                table: this.normalizeTable(block.table),
                images: this.normalizeImages(block.images),
            }))
            .sort((left, right) => left.order - right.order)
            .filter((block) => this.hasRenderableBlockContent(block));
    }

    private normalizeBlockTitle(title: string | null | undefined): string | null {
        const normalizedTitle = (title || '').trim();
        if (!normalizedTitle) {
            return null;
        }

        const hiddenToolTitles = new Set([
            'get_invoice_by_customercode',
            'get_inner_list_by_innerprocesscode_startdate_enddate',
        ]);
        const loweredTitle = normalizedTitle.toLocaleLowerCase('tr-TR');
        const isTechnicalToolTitle =
            hiddenToolTitles.has(loweredTitle)
            || loweredTitle.startsWith('func.tool')
            || loweredTitle.startsWith('tool.')
            || loweredTitle.startsWith('function.')
            || /^get_[a-z0-9_]+$/i.test(normalizedTitle);

        if (isTechnicalToolTitle) {
            return null;
        }

        return normalizedTitle;
    }

    private normalizeMessageBlocks(message: ConversationApiMessage): AiChatContentBlock[] {
        const normalizedBlocks = this.normalizeBlocks(message.blocks);
        if (normalizedBlocks.length > 0) {
            return normalizedBlocks;
        }

        if (typeof message.imageUrl === 'string' && message.imageUrl.trim().length > 0) {
            return [
                {
                    type: 'image',
                    title: null,
                    order: 0,
                    text: null,
                    table: null,
                    images: [
                        {
                            url: message.imageUrl,
                            caption: null,
                            alt: null,
                        },
                    ],
                },
            ];
        }

        return [];
    }

    private isSupportedBlockType(type: string | null | undefined): type is AiChatContentBlock['type'] {
        return type === 'text' || type === 'table' || type === 'image' || type === 'imageGallery';
    }

    private normalizeTable(table: AiChatTableData | null | undefined): AiChatTableData | null {
        if (!table || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
            return null;
        }

        return {
            columns: table.columns.filter((column) => typeof column === 'string' && column.trim().length > 0),
            rows: table.rows.filter((row) => !!row && typeof row === 'object'),
            totalRowCount: typeof table.totalRowCount === 'number' ? table.totalRowCount : null,
            isTruncated: Boolean(table.isTruncated),
        };
    }

    private normalizeImages(images: AiChatImageData[] | null | undefined): AiChatImageData[] {
        if (!Array.isArray(images)) {
            return [];
        }

        return images.filter((image) => typeof image?.url === 'string' && image.url.trim().length > 0);
    }

    private hasRenderableBlockContent(block: AiChatContentBlock): boolean {
        if (block.type === 'text') {
            return !!(block.text || '').trim();
        }

        if (block.type === 'table') {
            return this.hasRenderableTable(block.table);
        }

        return this.hasRenderableImages(block.images);
    }

    hasRenderableTable(table: AiChatTableData | null | undefined): boolean {
        return !!table && Array.isArray(table.columns) && table.columns.length > 0 && Array.isArray(table.rows) && table.rows.length > 0;
    }

    hasRenderableImages(images: AiChatImageData[] | null | undefined): boolean {
        return Array.isArray(images) && images.length > 0;
    }

    hasExternalAiImage(message: UiChatMessage): boolean {
        return !!message.hasImage && !!message.aiImageUrl;
    }

    isMessageArriving(messageId: string): boolean {
        const message = this.messages.find((item) => item.id === messageId);
        if (!message || message.role !== 'assistant') {
            return false;
        }

        const lastAssistantMessage = [...this.messages].reverse().find((item) => item.role === 'assistant');
        if (!lastAssistantMessage || lastAssistantMessage.id !== messageId) {
            return false;
        }

        const ageInMs = Date.now() - message.createdAt.getTime();
        return ageInMs >= 0 && ageInMs < 1800;
    }

    hasExcelExport(message: UiChatMessage): boolean {
        return !!message.hasExcel && !!message.excelUrl;
    }

    canReactToMessage(message: UiChatMessage): boolean {
        return message.role === 'assistant' && !message.isError;
    }

    isReactionActive(message: UiChatMessage, reaction: 'like' | 'dislike'): boolean {
        if (reaction === 'like') {
            return message.isLiked === true;
        }

        return message.isLiked === false;
    }

    async setMessageReaction(message: UiChatMessage, isLiked: boolean): Promise<void> {
        if (!this.activeConversationId || !this.canReactToMessage(message) || message.isReactionSaving) {
            return;
        }

        if (message.isLiked === isLiked) {
            return;
        }

        const previousReaction = message.isLiked ?? null;
        message.isLiked = isLiked;
        message.isReactionSaving = true;

        const request: ConversationMessageReactionRequest = { isLiked };
        try {
            await this.conversationsService.setMessageReaction(this.activeConversationId, message.id, request);
        } catch (err) {
            message.isLiked = previousReaction;
            console.error('[NebimAiChat] Mesaj reaction guncellenemedi:', err);
            this.errorMessage = 'Mesaj reaction guncellenemedi. Lutfen tekrar deneyin.';
        } finally {
            message.isReactionSaving = false;
        }
    }

    canShareOnWhatsApp(message: UiChatMessage): boolean {
        return this.buildWhatsAppShareText(message).trim().length > 0;
    }

    getWhatsAppShareUrl(message: UiChatMessage): string {
        const text = this.buildWhatsAppShareText(message).trim();
        return `https://wa.me/?text=${encodeURIComponent(text)}`;
    }

    getCellValue(row: Record<string, string | null>, column: string): string {
        return row[column] ?? '-';
    }

    insertTableCellValue(value: string, event?: Event): void {
        event?.preventDefault();

        const normalizedValue = value.trim();
        if (!normalizedValue || normalizedValue === '-') {
            return;
        }

        const currentInput = this.input.trimEnd();
        this.input = currentInput ? `${currentInput} ${normalizedValue}` : normalizedValue;
        this.onComposerInput();
        setTimeout(() => this.textArea?.nativeElement.focus(), 0);
    }

    isCellLink(row: Record<string, string | null>, column: string): boolean {
        return this.getCellLink(row, column) !== null;
    }

    isCellImage(row: Record<string, string | null>, column: string): boolean {
        const link = this.getCellLink(row, column);
        if (!link) {
            return false;
        }

        if (this.isImageUrl(link)) {
            return true;
        }

        const normalizedColumn = column.toLocaleLowerCase('tr-TR');
        return (
            normalizedColumn.includes('image') ||
            normalizedColumn.includes('foto') ||
            normalizedColumn.includes('gorsel') ||
            normalizedColumn.includes('photo') ||
            normalizedColumn.includes('picture')
        );
    }

    getCellLink(row: Record<string, string | null>, column: string): string | null {
        const rawValue = row[column];
        if (typeof rawValue !== 'string') {
            return null;
        }

        const value = rawValue.trim();
        if (!value) {
            return null;
        }

        if (/^https?:\/\//i.test(value)) {
            return value;
        }

        if (/^www\./i.test(value)) {
            return `https://${value}`;
        }

        if (/^(mailto:|tel:)/i.test(value)) {
            return value;
        }

        return null;
    }

    getCellLinkLabel(row: Record<string, string | null>, column: string): string {
        const link = this.getCellLink(row, column);
        if (!link) {
            return this.getCellValue(row, column);
        }

        const normalizedColumn = column.toLocaleLowerCase('tr-TR');
        if (normalizedColumn.includes('invoice') || normalizedColumn.includes('pdf')) {
            return 'PDF Ac';
        }

        if (normalizedColumn.includes('excel')) {
            return 'Excel Ac';
        }

        if (normalizedColumn.includes('image') || normalizedColumn.includes('foto') || normalizedColumn.includes('gorsel')) {
            return 'Gorseli Ac';
        }

        return 'Linki Ac';
    }

    private isImageUrl(url: string): boolean {
        try {
            const parsed = new URL(url);
            const normalizedPath = parsed.pathname.toLocaleLowerCase('tr-TR');
            return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(normalizedPath);
        } catch {
            return false;
        }
    }

    private toUiChatMessage(message: ConversationApiMessage): UiChatMessage {
        const blocks = this.normalizeMessageBlocks(message);
        const content = this.resolveMessageText(message);
        const mentions = this.extractMessageMentions(content);

        return {
            id: message.id ?? this.uid(),
            role: this.resolveRole(message),
            content,
            createdAt: message.createdDate ? new Date(message.createdDate) : new Date(),
            mentions,
            blocks,
            isError: false,
            hasImage: Boolean(message.hasImage),
            aiImageUrl: message.aiImageUrl ?? null,
            hasExcel: Boolean(message.hasExcel),
            excelUrl: message.excelUrl ?? null,
            isLiked: this.resolveReactionValue(message),
            isReactionSaving: false,
        };
    }

    private extractMessageMentions(content: string | null | undefined): MentionChipItem[] {
        const text = (content || '').trim();
        if (!text) {
            return [];
        }

        const tokens: string[] = [];
        const tokenRegex = /(^|\s)@([^\s@]+)/g;
        let match: RegExpExecArray | null = null;

        while ((match = tokenRegex.exec(text)) !== null) {
            const token = this.normalizeMention(match[2]);
            if (!token || tokens.includes(token)) {
                continue;
            }

            tokens.push(token);
        }

        return tokens.map((token) => {
            const relatedExtension = this.activeExtensionShortcuts.find(
                (item) => this.normalizeMention(item.mention) === token,
            );

            return {
                id: relatedExtension?.id || token,
                name: relatedExtension?.name || token.replace('@', ''),
                mention: token,
                photoUrl: relatedExtension?.photoUrl,
            };
        });
    }

    private resolveReactionValue(message: ConversationApiMessage): boolean | null {
        if (typeof message.isLiked === 'boolean') {
            return message.isLiked;
        }

        const record = message as unknown as Record<string, unknown>;
        const rawValue = record['IsLiked'] ?? record['isLiked'];
        if (typeof rawValue === 'boolean') {
            return rawValue;
        }

        return null;
    }

    private buildWhatsAppShareText(message: UiChatMessage): string {
        const parts: string[] = [];

        if (message.content.trim()) {
            parts.push(message.content.trim());
        }

        for (const block of message.blocks || []) {
            if (block.type === 'text' && block.text?.trim()) {
                if (!parts.includes(block.text.trim())) {
                    parts.push(block.text.trim());
                }
                continue;
            }

            if (block.type === 'table' && this.hasRenderableTable(block.table)) {
                parts.push(this.serializeTableForShare(block.title, block.table!));
                continue;
            }

            if ((block.type === 'image' || block.type === 'imageGallery') && this.hasRenderableImages(block.images)) {
                const imageLines = block.images!
                    .map((image, index) => `${block.title || 'Gorsel'} ${index + 1}: ${image.url}`);
                parts.push(imageLines.join('\n'));
            }
        }

        if (message.hasExcel && message.excelUrl) {
            parts.push(`Excel: ${message.excelUrl}`);
        }

        if (message.hasImage && message.aiImageUrl) {
            parts.push(`Gorsel: ${message.aiImageUrl}`);
        }

        return parts.filter((part) => part.trim().length > 0).join('\n\n');
    }

    private serializeTableForShare(title: string | null | undefined, table: AiChatTableData): string {
        const header = table.columns.join(' | ');
        const rows = table.rows.map((row) => table.columns.map((column) => this.getCellValue(row as Record<string, string | null>, column)).join(' | '));
        const lines = title ? [title, header, ...rows] : [header, ...rows];

        if (table.isTruncated) {
            lines.push('Not: Tablo kisaltilmis veridir.');
        }

        return lines.join('\n');
    }

    private applyConversationMessagesResponse(response: ConversationMessagesResponse): void {
        const mapped = this.mapConversationMessages(response);

        // Bos yanit ekrandaki mevcut mesajlari silmemeli.
        if (mapped.length === 0 && this.messages.length > 0) {
            return;
        }

        this.messages = mapped;
    }

    private isAwaitingAssistantReply(messages: UiChatMessage[]): boolean {
        if (messages.length === 0) {
            return false;
        }

        const lastMessage = messages[messages.length - 1];
        return lastMessage.role === 'user';
    }

    private async waitForAssistantMessage(conversationId: string): Promise<void> {
        if (this.assistantWaitConversationId === conversationId) {
            return;
        }

        this.assistantWaitConversationId = conversationId;
        const maxAttempts = 12;
        const attemptDelayMs = 800;

        try {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (this.activeConversationId !== conversationId) {
                    return;
                }

                const res = await this.conversationsService.getMessages(conversationId);
                if (!res.isSuccess || !res.data) {
                    await this.sleep(attemptDelayMs);
                    continue;
                }

                const loadedMessages = this.mapConversationMessages(res.data);
                if (loadedMessages.length > 0) {
                    this.messages = loadedMessages;
                    this.shouldScroll = true;
                }

                if (!this.isAwaitingAssistantReply(loadedMessages)) {
                    this.errorMessage = '';
                    return;
                }

                await this.sleep(attemptDelayMs);
            }
        } catch (err) {
            console.warn('[NebimAiChat] AI yaniti takip edilirken hata olustu:', err);
        } finally {
            if (this.assistantWaitConversationId === conversationId) {
                this.assistantWaitConversationId = null;
            }
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    private mapConversationMessages(response: ConversationMessagesResponse): UiChatMessage[] {
        return this.extractConversationMessages(response)
            .filter((message) => {
                const content = this.resolveMessageText(message);
                const blocks = this.normalizeMessageBlocks(message);
                return !!content || blocks.length > 0;
            })
            .map<UiChatMessage>((message) => this.toUiChatMessage(message));
    }

    private applyConversationReplyResponse(response: ConversationReplyResponse): void {
        const conversation = this.extractConversationFromReply(response);
        if (conversation) {
            this.applyConversationMessagesResponse(conversation);
        }

        const aiResponse = this.extractAiResponse(response);
        if (aiResponse && !aiResponse.success) {
            this.errorMessage = aiResponse.error || aiResponse.response || 'AI yanıtı alınamadı. Lütfen tekrar deneyin.';
        }
    }

    private toConversationLabel(conversation: ConversationHeader, index: number): string {
        const record = conversation as unknown as Record<string, unknown>;
        const customerName = this.readString(record['customerName'] ?? record['CustomerName']);
        const lastMessage = this.readString(record['lastMessage'] ?? record['LastMessage']);
        const lastMessages = this.readString(record['lastMessages'] ?? record['LastMessages']);
        if (customerName) return customerName;
        if (lastMessage) return lastMessage;
        if (lastMessages) return lastMessages;
        return `Sohbet ${index + 1}`;
    }

    private toConversationPreview(conversation: ConversationHeader): string {
        const record = conversation as unknown as Record<string, unknown>;
        return this.readString(
            record['lastMessage']
            ?? record['LastMessage']
            ?? record['lastMessages']
            ?? record['LastMessages']
        );
    }

    private toConversationDateText(conversation: ConversationHeader): string {
        const record = conversation as unknown as Record<string, unknown>;
        const rawDate = this.readString(
            record['lastMessageDate']
            ?? record['LastMessageDate']
            ?? record['updatedDate']
            ?? record['UpdatedDate']
            ?? record['createdDate']
            ?? record['CreatedDate']
        );

        if (!rawDate) return '';

        const date = new Date(rawDate);
        if (Number.isNaN(date.getTime())) return '';

        const now = new Date();
        const sameDay =
            date.getFullYear() === now.getFullYear()
            && date.getMonth() === now.getMonth()
            && date.getDate() === now.getDate();

        if (sameDay) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        }
  
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    }

    private readString(value: unknown): string {
        return typeof value === 'string' ? value.trim() : '';
    }

    private toEpoch(dateValue?: string): number {
        if (!dateValue) return 0;
        const ts = new Date(dateValue).getTime();
        return Number.isFinite(ts) ? ts : 0;
    }

    newChat(): void {
        this.resetConversationState();
        this.sidebarMobileOpen = false;
        void this.router.navigate(['/nebim-ai-chat']);
        setTimeout(() => this.textArea?.nativeElement.focus(), 0);
    }

    toggleSidebar(): void {
        if (this.isMobileViewport()) {
            // Mobilde sidebar icindeki toggle drawer'i kapatir
            this.sidebarMobileOpen = false;
            return;
        }

        this.sidebarCollapsed = !this.sidebarCollapsed;
        this.sidebarOpenedManually = !this.sidebarCollapsed;
    }

    /** Header hamburger: mobil'de drawer, desktop'ta collapse toggle */
    onHamburgerClick(): void {
        if (this.isMobileViewport()) {
            this.sidebarMobileOpen = !this.sidebarMobileOpen;
            if (this.sidebarMobileOpen) {
                // Mobil drawer her zaman tam genislikte acilmali
                this.sidebarCollapsed = false;
                this.sidebarOpenedManually = true;
            }
        } else {
            this.sidebarCollapsed = !this.sidebarCollapsed;
            this.sidebarOpenedManually = !this.sidebarCollapsed;
        }
    }

    openMobileSidebar(): void {
        this.sidebarMobileOpen = true;
        this.sidebarCollapsed = false;
        this.sidebarOpenedManually = true;
    }

    closeMobileSidebar(): void {
        this.sidebarMobileOpen = false;
    }  

    async onSelectChat(conversationId: string): Promise<void> {
        this.sidebarMobileOpen = false;
        await this.navigateToConversation(conversationId);
    }

    private async navigateToConversation(conversationId: string): Promise<void> {
        await this.router.navigate(['/c', conversationId]);
    }

    private async syncConversationFromRoute(routeConversationId: string | null): Promise<void> {
        if (!routeConversationId) {
            this.resetConversationState();
            return;
        }

        if (this.activeConversationId === routeConversationId && this.messages.length > 0) {
            return;
        }

        // Sohbet bu sayfadan yeni baslatildiysa sunucudan yuklemeye gerek yok;
        // guncel icerik reply yanitindan gelecek.
        if (this.locallyStartedConversationId === routeConversationId) {
            this.activeConversationId = routeConversationId;
            return;
        }

        // Baska bir sohbete gecildiginde "yeni baslatildi" isareti gecerliligini yitirir.
        this.locallyStartedConversationId = null;

        this.activeConversationId = routeConversationId;
        await this.loadThread(routeConversationId);
    }

    private resetConversationState(): void {
        this.messages = [];
        this.input = '';
        this.activeConversationId = null;
        this.locallyStartedConversationId = null;
        this.errorMessage = '';
    }

    private uid(): string {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }

}

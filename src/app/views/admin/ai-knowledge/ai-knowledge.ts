import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiKnowledgeService } from '@/app/core/services/ai-knowledge.service';
import { AiKnowledgeTypesService } from '@/app/core/services/ai-knowledge-types.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { UserIntegrationUserSocialMediaAccountsService } from '@/app/core/services/user-integration-user-social-media-accounts.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ConversationsService } from '@/app/core/services/conversations.service';
import { MessagesService, AiMessageDto } from '@/app/core/services/messages.service';
import {
    AiKnowledgeResponse,
    CreateAiKnowledgeRequest,
    UpdateAiKnowledgeRequest,
} from '@/app/core/models/ai-assistant/ai-knowledge.models';
import { AiKnowledgeTypeResponse } from '@/app/core/models/ai-assistant/ai-knowledge-type.models';
import { AiAssistant } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { IntegrationUser } from '@/app/core/models/integration/integration-user.models';
import { UserIntegrationUserSocialMediaAccountResponse } from '@/app/core/models/integration/user-integration-user-social-media-account.models';
import { PagedResult } from '@/app/core/models/pagination.model';

export interface KnowledgeGroup {
    typeName: string;
    typeId: string | null;
    items: AiKnowledgeResponse[];
}

export interface ChatBubble {
    role: 'user' | 'assistant';
    content: string;
    time: string;
}

@Component({
    selector: 'app-ai-knowledge-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-knowledge.html',
    styleUrls: ['./ai-knowledge.scss'],
})
export class AiKnowledgePage implements OnInit {
    // Veri
    items: AiKnowledgeResponse[] = [];
    assistants: AiAssistant[] = [];
    integrationUsers: IntegrationUser[] = [];
    knowledgeTypes: AiKnowledgeTypeResponse[] = [];
    loading = false;

    // Server-side pagination
    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private searchTimeout: any = null;

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: AiKnowledgeResponse | null = null;
    form: {
        aiAssistantId: string;
        aiKnowledgeTypeId: string;
        integrationUserId: string;
        prop: string;
        value: string;
        shortDescription: string;
    } = {
        aiAssistantId: '',
        aiKnowledgeTypeId: '',
        integrationUserId: '',
        prop: '',
        value: '',
        shortDescription: '',
    };

    // ────── Tab Yapısı ──────
    activeTab: 'entry' | 'preview' = 'entry';

    // ────── Önizleme State ──────
    selectedPreviewAssistantId = '';
    previewKnowledge: AiKnowledgeResponse[] = [];
    groupedKnowledge: KnowledgeGroup[] = [];
    previewLoading = false;

    // ────── UserIntSma State ──────
    userIntSmaAccounts: UserIntegrationUserSocialMediaAccountResponse[] = [];
    selectedUserIntSmaId = '';

    // ────── Chat State ──────
    chatMessages: ChatBubble[] = [];
    chatInput = '';
    chatLoading = false;
    selectedConversationId = '';
    testConversationLoading = false;
    autoAiMode = false;
    isAiSending = false;

    @ViewChild('chatScrollContainer') chatScrollContainer!: ElementRef;

    constructor(
        private knowledgeService: AiKnowledgeService,
        private knowledgeTypesService: AiKnowledgeTypesService,
        private aiProvidersService: AiProvidersService,
        private integrationsService: IntegrationsService,
        private userIntSmaService: UserIntegrationUserSocialMediaAccountsService,
        private authState: AuthStateService,
        private conversationsService: ConversationsService,
        private messagesService: MessagesService,
    ) {}

    ngOnInit(): void {
        this.loadKnowledge();
        this.loadAssistants();
        this.loadIntegrationUsers();
        this.loadKnowledgeTypes();
        this.loadUserIntSmaAccounts();
    }

    // ────── Veri yükleme ──────
    async loadKnowledge(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            const response = await this.knowledgeService.getPaged({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
                companyId,
            });
            const paged = PagedResult.from<AiKnowledgeResponse>(response);
            this.items = paged.items;
            this.totalCount = paged.totalCount;
            this.totalPages = paged.totalPages || Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('AI Knowledge yükleme hatası:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadAssistants(): Promise<void> {
        try {
            const companyId = this.authState.profile?.companyId || '';
            const resp = await this.aiProvidersService.getAssistantsPaged({ companyId });
            this.assistants = this.extractArray(resp?.data);
        } catch (err) {
            console.error('Assistants yükleme hatası:', err);
        }
    }

    async loadIntegrationUsers(): Promise<void> {
        try {
            const companyId = this.authState.profile?.companyId || '';
            const response = await this.integrationsService.getIntegrationUsersPaged({ companyId, pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.integrationUsers = paged?.items ?? [];
        } catch (err) {
            console.error('IntegrationUsers yükleme hatası:', err);
        }
    }

    async loadKnowledgeTypes(): Promise<void> {
        try {
            const resp = await this.knowledgeTypesService.getAll();
            const data = resp?.data;
            this.knowledgeTypes = this.extractArray(data).filter((t: AiKnowledgeTypeResponse) => !t.isBlocked);
        } catch (err) {
            console.error('Knowledge Types yükleme hatası:', err);
        }
    }

    async loadUserIntSmaAccounts(): Promise<void> {
        try {
            const companyId = this.authState.profile?.companyId || '';
            const response = await this.userIntSmaService.getByCompany(companyId, { companyId, pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.userIntSmaAccounts = paged?.items ?? [];
        } catch (err) {
            console.error('UserIntSma hesapları yükleme hatası:', err);
        }
    }

    private buildPagesArray(): void {
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    // ────── CRUD ──────
    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { aiAssistantId: '', aiKnowledgeTypeId: '', integrationUserId: '', prop: '', value: '', shortDescription: '' };
        this.showModal = true;
    }

    openEdit(item: AiKnowledgeResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            aiAssistantId: item.aiAssistantId || '',
            aiKnowledgeTypeId: item.aiKnowledgeTypeId || '',
            integrationUserId: item.integrationUserId || '',
            prop: item.prop || '',
            value: item.value || '',
            shortDescription: item.shortDescription || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            const userId = this.authState.profile?.userId || '';
            const companyId = this.authState.profile?.companyId || '';

            if (this.editMode && this.selectedItem) {
                const req: UpdateAiKnowledgeRequest = {
                    companyId,
                    userId,
                    aiAssistantId: this.form.aiAssistantId,
                    aiKnowledgeTypeId: this.form.aiKnowledgeTypeId || null,
                    integrationUserId: this.form.integrationUserId || null,
                    prop: this.form.prop,
                    value: this.form.value,
                    shortDescription: this.form.shortDescription || null,
                };
                await this.knowledgeService.update(this.selectedItem.id, req);
            } else {
                const req: CreateAiKnowledgeRequest = {
                    companyId,
                    userId,
                    aiAssistantId: this.form.aiAssistantId,
                    aiKnowledgeTypeId: this.form.aiKnowledgeTypeId || null,
                    integrationUserId: this.form.integrationUserId || null,
                    prop: this.form.prop,
                    value: this.form.value,
                    shortDescription: this.form.shortDescription || null,
                };
                await this.knowledgeService.create(req);
            }
            this.showModal = false;
            await this.loadKnowledge();
        } catch (err: any) {
            console.error('Kaydetme hatası:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: AiKnowledgeResponse): Promise<void> {
        if (confirm('Bu bilgi kaydını silmek istediğinize emin misiniz?')) {
            try {
                await this.knowledgeService.delete(item.id);
                await this.loadKnowledge();
            } catch (err) {
                console.error('Silme hatası:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    // ────── Server-side pagination ──────
    onFilterChange(): void {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadKnowledge();
        }, 400);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadKnowledge();
    }

    // ────── Yardımcı ──────
    getAssistantName(assistantId: string): string {
        if (!assistantId) return '—';
        const a = this.assistants.find(x => x.id === assistantId);
        return a?.name || '—';
    }

    getIntegrationUserName(integrationUserId: string): string {
        if (!integrationUserId) return '—';
        const iu = this.integrationUsers.find(x => x.id === integrationUserId);
        return iu?.integrationDescription || '—';
    }

    getKnowledgeTypeName(typeId: string | null): string {
        if (!typeId) return '—';
        const t = this.knowledgeTypes.find(x => x.id === typeId);
        return t?.type || '—';
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    // ────── Tab Yönetimi ──────
    setTab(tab: 'entry' | 'preview'): void {
        this.activeTab = tab;
    }

    // ────── Önizleme ──────
    async onPreviewAssistantChange(): Promise<void> {
        if (!this.selectedPreviewAssistantId) {
            this.previewKnowledge = [];
            this.groupedKnowledge = [];
            return;
        }
        this.previewLoading = true;
        try {
            const resp = await this.knowledgeService.getByAssistant(this.selectedPreviewAssistantId);
            this.previewKnowledge = this.extractArray(resp?.data);
            this.buildGroupedKnowledge();
        } catch (err) {
            console.error('Önizleme bilgi yükleme hatası:', err);
            this.previewKnowledge = [];
            this.groupedKnowledge = [];
        } finally {
            this.previewLoading = false;
        }
    }

    private buildGroupedKnowledge(): void {
        const map = new Map<string, KnowledgeGroup>();
        for (const item of this.previewKnowledge) {
            const typeId = item.aiKnowledgeTypeId || '__none__';
            if (!map.has(typeId)) {
                map.set(typeId, {
                    typeName: this.getKnowledgeTypeName(item.aiKnowledgeTypeId) || 'Genel',
                    typeId: item.aiKnowledgeTypeId,
                    items: [],
                });
            }
            map.get(typeId)!.items.push(item);
        }
        this.groupedKnowledge = Array.from(map.values());
    }

    getPreviewAssistantName(): string {
        if (!this.selectedPreviewAssistantId) return '';
        const a = this.assistants.find(x => x.id === this.selectedPreviewAssistantId);
        return a?.name || '';
    }

    // ────── Chat ──────

    /** "Sohbeti Başlat" butonu — test conversation oluşturur */
    async startTestChat(): Promise<void> {
        const companyId = this.authState.profile?.companyId || '';
        if (!companyId) return;

        this.testConversationLoading = true;
        try {
            const profileName = this.authState.profile?.name || 'Test';
            const profileSurname = this.authState.profile?.surname || 'User';
            const resp = await this.conversationsService.createTestConversation({
                companyId,
                firstName: profileName,
                lastName: profileSurname,
                userIntSmaId: this.selectedUserIntSmaId || null,
            });
            const conversationId = resp?.data as string;
            if (conversationId) {
                this.selectedConversationId = conversationId;
                this.chatMessages = [];
            }
        } catch (err) {
            console.error('Test sohbeti oluşturma hatası:', err);
            alert('Test sohbeti oluşturulamadı.');
        } finally {
            this.testConversationLoading = false;
        }
    }

    /** Customer olarak mesaj gönderir */
    async sendCustomerMessage(): Promise<void> {
        const msg = this.chatInput.trim();
        if (!msg || !this.selectedConversationId) return;

        const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        this.chatMessages.push({ role: 'user', content: msg, time: now });
        this.chatInput = '';
        this.scrollChatToBottom();

        this.chatLoading = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            const userId = this.authState.profile?.userId || '';

            // 1) Önce kullanıcı mesajını DB'ye kaydet
            await this.messagesService.sendMessage({
                conversationId: this.selectedConversationId,
                messageContent: msg,
                source: 'user',
                createdUserId: userId,
            });

            // 2) Sonra AI yanıtını tetikle
            await this.messagesService.testAiChat({
                conversationId: this.selectedConversationId,
                companyId,
                message: msg,
                userId,
            });

            // Mesajları yeniden yükle
            await this.reloadChatMessages();
            // Auto AI modu açıksa otomatik AI yanıtı gönder
            if (this.autoAiMode) {
                setTimeout(() => this.sendAiChat(), 500);
            }
        } catch (err) {
            console.error('Chat test hatası:', err);
            this.chatMessages.push({ role: 'assistant', content: '⚠️ Mesaj gönderilemedi. Lütfen tekrar deneyin.', time: now });
        } finally {
            this.chatLoading = false;
        }
    }

    /** AI Yanıt butonu — son müşteri mesajını AI'a gönderir */
    async sendAiChat(): Promise<void> {
        if (!this.selectedConversationId) return;

        // Son müşteri mesajını bul
        const lastCustomerMsg = [...this.chatMessages].reverse().find(m => m.role === 'user');
        if (!lastCustomerMsg) return;

        this.isAiSending = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            await this.messagesService.testAiChat({
                conversationId: this.selectedConversationId,
                companyId,
                message: lastCustomerMsg.content,
                userId: this.authState.profile?.userId,
            });
            await this.reloadChatMessages();
        } catch (err) {
            console.error('AI Chat hatası:', err);
            const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            this.chatMessages.push({ role: 'assistant', content: '⚠️ AI yanıtı alınamadı. Lütfen tekrar deneyin.', time: now });
        } finally {
            this.isAiSending = false;
        }
    }

    /** Mevcut konuşmanın mesajlarını API'den yeniden yükler */
    private async reloadChatMessages(): Promise<void> {
        const resp = await this.conversationsService.getMessages(this.selectedConversationId);
        const body = resp?.data;
        const messages = body?.messages
            ? (Array.isArray(body.messages) ? body.messages : (body.messages as any)?.$values ?? [])
            : this.extractArray(body);
        this.chatMessages = messages.map((m: any) => ({
            role: (m.source === 'user' || m.source === 'customer') ? 'user' as const : 'assistant' as const,
            content: m.text || m.messageText || m.messageContent || '',
            time: m.createdDate ? new Date(m.createdDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
        }));
        this.scrollChatToBottom();
    }

    /** Son mesaj müşteriden mi? AI Yanıt butonu için kontrol */
    get isLastMessageFromCustomer(): boolean {
        if (this.chatMessages.length === 0) return false;
        return this.chatMessages[this.chatMessages.length - 1].role === 'user';
    }

    /** Enter ile mesaj gönderir (eski sendChatMessage yerine) */
    async sendChatMessage(): Promise<void> {
        await this.sendCustomerMessage();
    }

    private scrollChatToBottom(): void {
        setTimeout(() => {
            if (this.chatScrollContainer?.nativeElement) {
                const el = this.chatScrollContainer.nativeElement;
                el.scrollTop = el.scrollHeight;
            }
        }, 100);
    }
}

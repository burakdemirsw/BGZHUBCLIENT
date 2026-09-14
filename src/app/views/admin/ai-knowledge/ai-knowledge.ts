import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiKnowledgeService } from '@/app/core/services/ai-knowledge.service';
import { AiKnowledgeTypesService } from '@/app/core/services/ai-knowledge-types.service';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import {
    AiKnowledgeResponse,
    CreateAiKnowledgeRequest,
    UpdateAiKnowledgeRequest,
} from '@/app/core/models/ai-assistant/ai-knowledge.models';
import { AiKnowledgeTypeResponse } from '@/app/core/models/ai-assistant/ai-knowledge-type.models';
import { AiAssistant, UpdateAiAssistantRequest } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { IntegrationUser } from '@/app/core/models/integration/integration-user.models';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import { PagedResult } from '@/app/core/models/pagination.model';

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
    extensionDefinitions: ExtensionDefinition[] = [];
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
        extensionId: string;
        aiKnowledgeTypeId: string;
        integrationUserId: string;
        prop: string;
        value: string;
        shortDescription: string;
    } = {
        aiAssistantId: '',
        extensionId: '',
        aiKnowledgeTypeId: '',
        integrationUserId: '',
        prop: '',
        value: '',
        shortDescription: '',
    };

    // ────── Asistan Adı Güncelleme ──────
    showRenameModal = false;
    renameAssistantId = '';
    renameAssistantName = '';
    renameSaving = false;

    constructor(
        private knowledgeService: AiKnowledgeService,
        private knowledgeTypesService: AiKnowledgeTypesService,
        private aiProvidersService: AiProvidersService,
        private integrationsService: IntegrationsService,
        private extensionManagementService: ExtensionManagementService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadKnowledge();
        this.loadAssistants();
        this.loadIntegrationUsers();
        this.loadKnowledgeTypes();
        this.loadExtensionDefinitions();
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

    async loadExtensionDefinitions(): Promise<void> {
        try {
            const resp = await this.extensionManagementService.getExtensionDefinitions();
            this.extensionDefinitions = this.extractArray(resp?.data).filter((x: ExtensionDefinition) => x.isActive);
        } catch (err) {
            console.error('ExtensionDefinitions yukleme hatasi:', err);
            this.extensionDefinitions = [];
        }
    }

    private buildPagesArray(): void {
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    // ────── CRUD ──────
    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { aiAssistantId: '', extensionId: '', aiKnowledgeTypeId: '', integrationUserId: '', prop: '', value: '', shortDescription: '' };
        this.showModal = true;
    }

    openEdit(item: AiKnowledgeResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            aiAssistantId: item.aiAssistantId || '',
            extensionId: item.extensionId || '',
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
                    extensionId: this.form.extensionId,
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
                    extensionId: this.form.extensionId,
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

    getExtensionName(extensionId: string): string {
        if (!extensionId) return '—';
        const extension = this.extensionDefinitions.find(x => x.id === extensionId);
        return extension?.name || '—';
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    // ────── Asistan Adı Güncelleme ──────
    openRenameAssistant(assistantId: string): void {
        const assistant = this.assistants.find(a => a.id === assistantId);
        if (!assistant) return;
        this.renameAssistantId = assistant.id;
        this.renameAssistantName = assistant.name || '';
        this.showRenameModal = true;
    }

    async saveAssistantName(): Promise<void> {
        if (!this.renameAssistantId || !this.renameAssistantName.trim()) return;
        const assistant = this.assistants.find(a => a.id === this.renameAssistantId);
        if (!assistant) return;

        this.renameSaving = true;
        try {
            const req: UpdateAiAssistantRequest = {
                userId: this.authState.profile?.userId || '',
                companyId: this.authState.profile?.companyId || '',
                name: this.renameAssistantName.trim(),
                aiProviderId: assistant.aiProviderId,
                aiModelId: assistant.aiModelId,
                order: assistant.order ?? 0,
                isBlocked: assistant.isBlocked ?? false,
            };
            await this.aiProvidersService.updateAssistant(this.renameAssistantId, req);
            // Listeyi güncelle
            assistant.name = this.renameAssistantName.trim();
            this.showRenameModal = false;
        } catch (err) {
            console.error('Asistan adı güncelleme hatası:', err);
            alert('Asistan adı güncellenirken hata oluştu.');
        } finally {
            this.renameSaving = false;
        }
    }

    closeRenameModal(): void {
        this.showRenameModal = false;
    }
}

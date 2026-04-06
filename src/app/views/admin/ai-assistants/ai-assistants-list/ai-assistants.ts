import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AiAssistant, AiKnowledge, CreateAiAssistantRequest, UpdateAiAssistantRequest, CreateAiKnowledgeRequest } from '@/app/core/models/ai-assistant/ai-assistant.models';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import { AiModel } from '@/app/core/models/ai-assistant/ai-model.models';
import { UserMenuService } from '@/app/core/services/user-menu.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { PagedResult } from '@/app/core/models/pagination.model';

@Component({
    selector: 'app-ai-assistants-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-assistants.html',
})
export class AiAssistantsPage implements OnInit {
    assistants: AiAssistant[] = [];
    providers: AiProvider[] = [];
    models: AiModel[] = [];
    filteredModels: AiModel[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedAssistant: AiAssistant | null = null;

    // Server-side pagination
    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private searchTimeout: any = null;

    // Knowledge for selected assistant
    knowledgeList: AiKnowledge[] = [];
    newKnowledge: { prop: string; value: string }[] = [];

    form: any = {
        name: '',
        aiProviderId: '',
        aiModelId: '',
        isBlocked: false,
    };

    constructor(
        private aiService: AiProvidersService,
        private userMenuService: UserMenuService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadAssistants();
        this.loadProviders();
        this.loadModels();
    }

    onFilterChange(): void {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadAssistants();
        }, 400);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadAssistants();
    }

    private buildPagesArray(): void {
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    async loadAssistants(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getAssistantsPaged({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
                companyId: companyId,
            });
            const paged = PagedResult.from<AiAssistant>(response);
            this.assistants = paged.items;
            this.totalCount = paged.totalCount;
            this.totalPages = paged.totalPages || Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('AiAssistants load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadProviders(): Promise<void> {
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getProvidersPaged({ pageNumber: 1, pageSize: 1000, companyId });
            const paged = PagedResult.from<AiProvider>(response);
            this.providers = paged.items;
        } catch (err) {
            console.error('Providers load error:', err);
        }
    }

    async loadModels(): Promise<void> {
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getModelsPaged({ pageNumber: 1, pageSize: 1000, companyId });
            const paged = PagedResult.from<AiModel>(response);
            this.models = paged.items;
            this.filteredModels = this.models;
        } catch (err) {
            console.error('Models load error:', err);
        }
    }

    async loadKnowledge(assistantId: string): Promise<void> {
        try {
            const response = await this.aiService.getKnowledgeByAssistant(assistantId);
            this.knowledgeList = this.extractArray(response?.data);
        } catch (err) {
            console.error('Knowledge load error:', err);
            this.knowledgeList = [];
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    getProviderName(providerId: string): string {
        const provider = this.providers.find(p => p.id === providerId);
        return provider?.firmDescription ?? providerId;
    }

    getModelName(modelId: string): string {
        const model = this.models.find(m => m.id === modelId);
        return model?.name ?? modelId;
    }

    onProviderChange(): void {
        if (this.form.aiProviderId) {
            this.filteredModels = this.models.filter(m => m.aiProviderId === this.form.aiProviderId);
        } else {
            this.filteredModels = this.models;
        }
        if (!this.filteredModels.find(m => m.id === this.form.aiModelId)) {
            this.form.aiModelId = '';
        }
    }

    // ── Knowledge row management ──
    addKnowledgeRow(): void {
        this.newKnowledge.push({ prop: '', value: '' });
    }

    removeKnowledgeRow(index: number): void {
        this.newKnowledge.splice(index, 1);
    }

    async deleteExistingKnowledge(knowledge: AiKnowledge): Promise<void> {
        if (confirm(`"${knowledge.prop}" bilgisini silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteKnowledge(knowledge.id);
                this.knowledgeList = this.knowledgeList.filter(k => k.id !== knowledge.id);
            } catch (err) {
                console.error('Knowledge delete error:', err);
            }
        }
    }

    // ── CRUD ──
    openCreate(): void {
        this.editMode = false;
        this.selectedAssistant = null;
        this.knowledgeList = [];
        this.newKnowledge = [];
        this.form = {
            name: '',
            aiProviderId: '',
            aiModelId: '',
            isBlocked: false,
        };
        this.filteredModels = this.models;
        this.showModal = true;
    }

    async openEdit(assistant: AiAssistant): Promise<void> {
        this.editMode = true;
        this.selectedAssistant = assistant;
        this.newKnowledge = [];
        this.form = {
            name: assistant.name,
            aiProviderId: assistant.aiProviderId,
            aiModelId: assistant.aiModelId,
            isBlocked: assistant.isBlocked ?? false,
        };
        this.onProviderChange();
        await this.loadKnowledge(assistant.id);
        this.showModal = true;
    }

    async save(): Promise<void> {
        const userId = this.userMenuService.getUserIdFromToken();
        if (!userId) {
            alert('Kullanıcı bilgisi alınamadı. Lütfen tekrar giriş yapın.');
            return;
        }

        try {
            let assistantId: string | null = null;

            if (this.editMode && this.selectedAssistant) {
                const req: UpdateAiAssistantRequest = {
                    userId: userId,
                    companyId: this.authStateService.profile?.companyId || '',
                    name: this.form.name,
                    aiProviderId: this.form.aiProviderId,
                    aiModelId: this.form.aiModelId,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateAssistant(this.selectedAssistant.id, req);
                assistantId = this.selectedAssistant.id;
            } else {
                const req: CreateAiAssistantRequest = {
                    userId: userId,
                    companyId: this.authStateService.profile?.companyId || '',
                    name: this.form.name,
                    aiProviderId: this.form.aiProviderId,
                    aiModelId: this.form.aiModelId,
                };
                try {
                    const res = await this.aiService.createAssistant(req);
                    assistantId = res?.data?.id ?? null;
                } catch (err: any) {
                    // Backend CreatedAtAction route hatası — kayıt oluşmuş olabilir
                    if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                        // Yeni eklenen asistanı bul
                        await this.loadAssistants();
                        const found = this.assistants.find(a => a.name === this.form.name && a.userId === userId);
                        assistantId = found?.id ?? null;
                    } else {
                        throw err;
                    }
                }
            }

            // Yeni knowledge kayıtlarını ekle
            if (assistantId) {
                for (const k of this.newKnowledge) {
                    if (k.prop.trim() && k.value.trim()) {
                        const kReq: CreateAiKnowledgeRequest = {
                            companyId: this.authStateService.profile?.companyId || '',
                            userId: userId,
                            aiAssistantId: assistantId,
                            prop: k.prop,
                            value: k.value,
                        };
                        try {
                            await this.aiService.createKnowledge(kReq);
                        } catch (kErr: any) {
                            if (!(kErr.status === 400 && JSON.stringify(kErr.error)?.includes('No route matches'))) {
                                console.error('Knowledge create error:', kErr);
                            }
                        }
                    }
                }
            }

            this.showModal = false;
            await this.loadAssistants();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadAssistants();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteAssistant(assistant: AiAssistant): Promise<void> {
        if (confirm(`"${assistant.name}" asistanını silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteAssistant(assistant.id);
                await this.loadAssistants();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

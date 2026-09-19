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
import { AiKnowledgeService } from '@/app/core/services/ai-knowledge.service';
import { AiKnowledgeResponse, CreateAiKnowledgeRequest as CreateKnowledgeCopyRequest } from '@/app/core/models/ai-assistant/ai-knowledge.models';
import { PromptAiAssistantsService } from '@/app/core/services/prompt-ai-assistants.service';
import { PromptAiAssistant, CreatePromptAiAssistantRequest } from '@/app/core/models/ai-assistant/prompt.models';

interface AiAssistantForm {
    name: string;
    aiProviderId: string;
    aiModelId: string;
    order: number;
    isBlocked: boolean;
}

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
    copyingId: string | null = null;
    togglingId: string | null = null;

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

    form: AiAssistantForm = {
        name: '',
        aiProviderId: '',
        aiModelId: '',
        order: 0,
        isBlocked: false,
    };

    constructor(
        private aiService: AiProvidersService,
        private userMenuService: UserMenuService,
        private authStateService: AuthStateService,
        private aiKnowledgeService: AiKnowledgeService,
        private promptAiAssistantsService: PromptAiAssistantsService,
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
            order: 0,
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
            order: assistant.order ?? 0,
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
                    order: Number(this.form.order),
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
                    order: Number(this.form.order),
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

    // ── Kopyalama: asistan + bilgi tabanı + prompt atamaları ──
    async copyAssistant(assistant: AiAssistant): Promise<void> {
        if (this.copyingId) return;
        if (!confirm(`"${assistant.name}" asistanı tüm özellikleriyle (bilgi tabanı ve promptlar) kopyalansın mı?`)) return;

        const userId = this.userMenuService.getUserIdFromToken();
        const companyId = this.authStateService.profile?.companyId || '';
        if (!userId) {
            alert('Kullanıcı bilgisi alınamadı. Lütfen tekrar giriş yapın.');
            return;
        }

        this.copyingId = assistant.id;
        try {
            const newName = `${assistant.name} (Kopya)`;
            const req: CreateAiAssistantRequest = {
                userId,
                companyId,
                name: newName,
                aiProviderId: assistant.aiProviderId,
                aiModelId: assistant.aiModelId,
                order: Number(assistant.order ?? 0),
            };

            let newId: string | null = null;
            try {
                const res = await this.aiService.createAssistant(req);
                newId = res?.data?.id ?? null;
            } catch (err: any) {
                if (!this.isNoRouteError(err)) throw err;
            }
            if (!newId) {
                // Backend CreatedAtAction route hatası — kaydı isimden bul
                const response = await this.aiService.getAssistantsPaged({ pageNumber: 1, pageSize: 50, searchTerm: newName, companyId });
                const found = PagedResult.from<AiAssistant>(response).items
                    .filter(a => a.name === newName && a.id !== assistant.id)
                    .sort((a, b) => (b.createdDate ?? '').localeCompare(a.createdDate ?? ''))[0];
                newId = found?.id ?? null;
            }
            if (!newId) throw new Error('Kopyalanan asistan bulunamadı.');

            // Pasif durumu kopyala
            if (assistant.isBlocked) {
                const upd: UpdateAiAssistantRequest = { ...req, isBlocked: true };
                await this.aiService.updateAssistant(newId, upd);
            }

            // Bilgi tabanı (knowledge)
            const kRes = await this.aiKnowledgeService.getByAssistant(assistant.id);
            const knowledge = this.extractArray(kRes?.data) as AiKnowledgeResponse[];
            for (const k of knowledge) {
                const kReq: CreateKnowledgeCopyRequest = {
                    companyId,
                    userId,
                    aiAssistantId: newId,
                    extensionId: k.extensionId,
                    aiKnowledgeTypeId: k.aiKnowledgeTypeId ?? null,
                    prop: k.prop ?? '',
                    value: k.value ?? '',
                    shortDescription: k.shortDescription ?? null,
                };
                await this.createIgnoringNoRoute(() => this.aiKnowledgeService.create(kReq));
            }

            // Prompt atamaları
            const pRes = await this.promptAiAssistantsService.getByAssistant(assistant.id);
            const prompts = this.extractArray(pRes?.data) as PromptAiAssistant[];
            for (const p of prompts) {
                const pReq: CreatePromptAiAssistantRequest = {
                    promptId: p.promptId,
                    aiAssistantId: newId,
                    order: p.order,
                    isFirst: p.isFirst,
                    userId,
                    companyId,
                };
                await this.createIgnoringNoRoute(() => this.promptAiAssistantsService.create(pReq));
            }

            await this.loadAssistants();
            alert(`"${newName}" oluşturuldu.\nBilgi: ${knowledge.length}, Prompt: ${prompts.length} kayıt kopyalandı.`);
        } catch (err: any) {
            console.error('Copy error:', err);
            alert('Kopyalama hatası: ' + (err?.error?.message || err?.message || 'Bilinmeyen hata'));
            await this.loadAssistants();
        } finally {
            this.copyingId = null;
        }
    }

    private isNoRouteError(err: any): boolean {
        return err?.status === 400 && !!JSON.stringify(err.error)?.includes('No route matches');
    }

    private async createIgnoringNoRoute(fn: () => Promise<unknown>): Promise<void> {
        try {
            await fn();
        } catch (err: any) {
            if (!this.isNoRouteError(err)) throw err;
        }
    }

    async toggleActive(assistant: AiAssistant): Promise<void> {
        if (this.togglingId) return;
        const userId = this.userMenuService.getUserIdFromToken();
        if (!userId) {
            alert('Kullanıcı bilgisi alınamadı. Lütfen tekrar giriş yapın.');
            return;
        }
        const newBlocked = !assistant.isBlocked;
        this.togglingId = assistant.id;
        try {
            const req: UpdateAiAssistantRequest = {
                userId,
                companyId: this.authStateService.profile?.companyId || '',
                name: assistant.name,
                aiProviderId: assistant.aiProviderId,
                aiModelId: assistant.aiModelId,
                order: Number(assistant.order ?? 0),
                isBlocked: newBlocked,
            };
            await this.aiService.updateAssistant(assistant.id, req);
            assistant.isBlocked = newBlocked;
        } catch (err: any) {
            console.error('Toggle error:', err);
            alert('Durum güncellenemedi: ' + (err?.error?.message || err?.error?.title || err?.message || 'Bilinmeyen hata'));
        } finally {
            this.togglingId = null;
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

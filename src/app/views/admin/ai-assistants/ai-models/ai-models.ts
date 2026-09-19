import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiModel, CreateAiModelRequest, UpdateAiModelRequest } from '@/app/core/models/ai-assistant/ai-model.models';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';

interface AiModelForm {
    aiProviderId: string;
    name: string;
    modelCode: string;
    priorityOrder: number;
    isBlocked: boolean;
}

interface AiModelProviderGroup {
    category: string;
    items: AiModel[];
}

@Component({
    selector: 'app-ai-models-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-models.html',
    styleUrls: ['./ai-models.scss'],
})
export class AiModelsPage implements OnInit {
    models: AiModel[] = [];
    providers: AiProvider[] = [];
    providersById: Record<string, AiProvider> = {};

    loading = false;
    showModal = false;
    editMode = false;
    selectedModel: AiModel | null = null;
    togglingId: string | null = null;

    filterText = '';
    filteredModels: AiModel[] = [];
    pagedModels: AiModel[] = [];
    groupedPagedModels: AiModelProviderGroup[] = [];
    currentPage = 1;
    pageSize = 12;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: AiModelForm = {
        aiProviderId: '',
        name: '',
        modelCode: '',
        priorityOrder: 0,
        isBlocked: false,
    };

    constructor(
        private aiService: AiProvidersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadPageData();
    }

    async loadPageData(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const [modelsResponse, providersResponse] = await Promise.all([
                this.aiService.getModelsPaged({ pageNumber: 1, pageSize: 1000, companyId }),
                this.aiService.getProvidersPaged({ pageNumber: 1, pageSize: 1000, companyId }),
            ]);
            this.models = this.extractArray<AiModel>(modelsResponse?.data);
            this.providers = this.extractArray<AiProvider>(providersResponse?.data);
            this.providersById = {};
            this.providers.forEach(provider => {
                this.providersById[provider.id] = provider;
            });

            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiModels load error:', err);
            this.models = [];
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const filter = (this.filterText || '').toLowerCase();
        this.filteredModels = this.models.filter(item =>
            (item.name || '').toLowerCase().includes(filter) ||
            (item.modelCode || '').toLowerCase().includes(filter) ||
            this.getProviderName(item.aiProviderId).toLowerCase().includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredModels.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedModels = this.filteredModels.slice(start, start + this.pageSize);
        this.groupedPagedModels = this.buildProviderGroups(this.pagedModels);
    }

    getProviderName(providerId: string): string {
        return this.providersById[providerId]?.firmDescription ?? providerId;
    }

    getProviderPhotoUrl(providerId: string): string {
        return this.providersById[providerId]?.photoUrl || '';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedModel = null;
        this.form = {
            aiProviderId: '',
            name: '',
            modelCode: '',
            priorityOrder: 0,
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(model: AiModel): void {
        this.editMode = true;
        this.selectedModel = model;
        this.form = {
            aiProviderId: model.aiProviderId,
            name: model.name,
            modelCode: model.modelCode,
            priorityOrder: model.priorityOrder,
            isBlocked: model.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedModel) {
                // inputTokenLimit/outputTokenLimit/inputPrice/outputPrice bu sayfada gösterilmiyor;
                // backend zorunlu tuttuğu için mevcut değerler değiştirilmeden gönderilir.
                const req: UpdateAiModelRequest = {
                    aiProviderId: this.form.aiProviderId,
                    name: this.form.name,
                    modelCode: this.form.modelCode,
                    priorityOrder: Number(this.form.priorityOrder),
                    inputTokenLimit: this.selectedModel.inputTokenLimit ?? 0,
                    outputTokenLimit: this.selectedModel.outputTokenLimit ?? 0,
                    inputPrice: this.selectedModel.inputPrice ?? 0,
                    outputPrice: this.selectedModel.outputPrice ?? 0,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateModel(this.selectedModel.id, req);
            } else {
                const req: CreateAiModelRequest = {
                    aiProviderId: this.form.aiProviderId,
                    name: this.form.name,
                    modelCode: this.form.modelCode,
                    priorityOrder: Number(this.form.priorityOrder),
                    inputTokenLimit: 0,
                    outputTokenLimit: 0,
                    inputPrice: 0,
                    outputPrice: 0,
                };
                await this.aiService.createModel(req);
            }
            this.showModal = false;
            await this.loadPageData();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadPageData();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteModel(model: AiModel): Promise<void> {
        if (confirm(`"${model.name}" modelini silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteModel(model.id);
                await this.loadPageData();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    onDeleteClick(event: Event, model: AiModel): void {
        event.stopPropagation();
        this.deleteModel(model);
    }

    async toggleActive(model: AiModel): Promise<void> {
        if (this.togglingId) return;
        const newBlocked = !model.isBlocked;
        this.togglingId = model.id;
        try {
            const req: UpdateAiModelRequest = {
                aiProviderId: model.aiProviderId,
                name: model.name,
                modelCode: model.modelCode,
                priorityOrder: Number(model.priorityOrder ?? 0),
                inputTokenLimit: model.inputTokenLimit ?? 0,
                outputTokenLimit: model.outputTokenLimit ?? 0,
                inputPrice: model.inputPrice ?? 0,
                outputPrice: model.outputPrice ?? 0,
                isBlocked: newBlocked,
            };
            await this.aiService.updateModel(model.id, req);
            model.isBlocked = newBlocked;
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

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== 'object') return [];

        const source = response as { data?: unknown; items?: unknown; result?: unknown; $values?: unknown };

        if (Array.isArray(source.$values)) return source.$values as T[];
        if (Array.isArray(source.items)) return source.items as T[];
        if (Array.isArray(source.result)) return source.result as T[];
        if (Array.isArray(source.data)) return source.data as T[];

        return [];
    }

    private buildProviderGroups(items: AiModel[]): AiModelProviderGroup[] {
        const groups: Record<string, AiModel[]> = {};

        items.forEach(item => {
            const category = (this.getProviderName(item.aiProviderId) || '').trim() || 'Diğer';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(item);
        });

        return Object.keys(groups)
            .sort((a, b) => a.localeCompare(b, 'tr'))
            .map(category => ({
                category,
                items: groups[category],
            }));
    }
}

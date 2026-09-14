import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiModel, CreateAiModelRequest, UpdateAiModelRequest } from '@/app/core/models/ai-assistant/ai-model.models';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import { PagedResult } from '@/app/core/models/pagination.model';

interface AiModelForm {
    aiProviderId: string;
    name: string;
    modelCode: string;
    priorityOrder: number;
    inputTokenLimit: number;
    outputTokenLimit: number;
    inputPrice: number;
    outputPrice: number;
    isBlocked: boolean;
}

@Component({
    selector: 'app-ai-models-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-models.html',
})
export class AiModelsPage implements OnInit {
    models: AiModel[] = [];
    providers: AiProvider[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedModel: AiModel | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: AiModel[] = [];
    pagedItems: AiModel[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: AiModelForm = {
        aiProviderId: '',
        name: '',
        modelCode: '',
        priorityOrder: 0,
        inputTokenLimit: 0,
        outputTokenLimit: 0,
        inputPrice: 0,
        outputPrice: 0,
        isBlocked: false,
    };

    constructor(
        private aiService: AiProvidersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadModels();
        this.loadProviders();
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
        this.filteredItems = this.models.filter(item =>
            (item.name || '').toLowerCase().includes(filter) ||
            (item.modelCode || '').toLowerCase().includes(filter) ||
            String(item.priorityOrder ?? '').includes(filter) ||
            (item.aiProvider?.firmDescription || '').toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadModels(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getModelsPaged({ pageNumber: 1, pageSize: 1000, companyId });
            const paged = PagedResult.from<AiModel>(response);
            this.models = paged.items;
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiModels load error:', err);
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

    openCreate(): void {
        this.editMode = false;
        this.selectedModel = null;
        this.form = {
            aiProviderId: '',
            name: '',
            modelCode: '',
            priorityOrder: 0,
            inputTokenLimit: 0,
            outputTokenLimit: 0,
            inputPrice: 0,
            outputPrice: 0,
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
            inputTokenLimit: model.inputTokenLimit,
            outputTokenLimit: model.outputTokenLimit,
            inputPrice: model.inputPrice,
            outputPrice: model.outputPrice,
            isBlocked: model.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedModel) {
                const req: UpdateAiModelRequest = {
                    aiProviderId: this.form.aiProviderId,
                    name: this.form.name,
                    modelCode: this.form.modelCode,
                    priorityOrder: Number(this.form.priorityOrder),
                    inputTokenLimit: Number(this.form.inputTokenLimit),
                    outputTokenLimit: Number(this.form.outputTokenLimit),
                    inputPrice: Number(this.form.inputPrice),
                    outputPrice: Number(this.form.outputPrice),
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateModel(this.selectedModel.id, req);
            } else {
                const req: CreateAiModelRequest = {
                    aiProviderId: this.form.aiProviderId,
                    name: this.form.name,
                    modelCode: this.form.modelCode,
                    priorityOrder: Number(this.form.priorityOrder),
                    inputTokenLimit: Number(this.form.inputTokenLimit),
                    outputTokenLimit: Number(this.form.outputTokenLimit),
                    inputPrice: Number(this.form.inputPrice),
                    outputPrice: Number(this.form.outputPrice),
                };
                await this.aiService.createModel(req);
            }
            this.showModal = false;
            await this.loadModels();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadModels();
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
                await this.loadModels();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

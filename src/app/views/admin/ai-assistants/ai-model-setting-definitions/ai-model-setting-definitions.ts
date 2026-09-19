import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiModel } from '@/app/core/models/ai-assistant/ai-model.models';
import {
    AiModelSettingDefinition,
    CreateAiModelSettingDefinitionRequest,
    UpdateAiModelSettingDefinitionRequest,
} from '@/app/core/models/ai-assistant/ai-model-setting-definition.models';
import { PagedResult } from '@/app/core/models/pagination.model';

interface AiModelSettingDefinitionForm {
    aiModelId: string;
    key: string;
    displayName: string;
    inputType: string;
    isRequired: boolean;
    placeholder: string;
    defaultValue: string;
    sortOrder: number;
    isActive: boolean;
}

@Component({
    selector: 'app-ai-model-setting-definitions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-model-setting-definitions.html',
})
export class AiModelSettingDefinitionsPage implements OnInit {
    models: AiModel[] = [];
    items: AiModelSettingDefinition[] = [];

    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: AiModelSettingDefinition | null = null;
    togglingId: string | null = null;

    selectedModelId = '';

    // ⚠️ Datatable
    filterText = '';
    filteredItems: AiModelSettingDefinition[] = [];
    pagedItems: AiModelSettingDefinition[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: AiModelSettingDefinitionForm = {
        aiModelId: '',
        key: '',
        displayName: '',
        inputType: 'text',
        isRequired: false,
        placeholder: '',
        defaultValue: '',
        sortOrder: 0,
        isActive: true,
    };

    inputTypeOptions = ['text', 'textarea', 'number', 'password', 'email', 'url', 'select', 'checkbox'];

    constructor(
        private aiService: AiProvidersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadModels();
    }

    async loadModels(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.aiService.getModelsPaged({ pageNumber: 1, pageSize: 1000, companyId });
            const paged = PagedResult.from<AiModel>(response);
            this.models = paged.items;

            if (!this.selectedModelId && this.models.length > 0) {
                this.selectedModelId = this.models[0].id;
            }

            await this.loadItems();
        } catch (err) {
            console.error('AiModelSettingDefinitions models load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadItems(): Promise<void> {
        if (!this.selectedModelId) {
            this.items = [];
            this.applyFilterAndPaging();
            return;
        }

        this.loading = true;
        try {
            const response = await this.aiService.getModelSettingDefinitionsByModel(this.selectedModelId);
            this.items = this.extractArray<AiModelSettingDefinition>(response?.data)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiModelSettingDefinitions load error:', err);
            this.items = [];
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    onModelChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    getModelName(modelId: string): string {
        const model = this.models.find(m => m.id === modelId);
        return model?.name ?? modelId;
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
        this.filteredItems = this.items.filter(item =>
            (item.key || '').toLowerCase().includes(filter) ||
            (item.displayName || '').toLowerCase().includes(filter) ||
            (item.inputType || '').toLowerCase().includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            aiModelId: this.selectedModelId,
            key: '',
            displayName: '',
            inputType: 'text',
            isRequired: false,
            placeholder: '',
            defaultValue: '',
            sortOrder: this.items.length,
            isActive: true,
        };
        this.showModal = true;
    }

    openEdit(item: AiModelSettingDefinition): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            aiModelId: item.aiModelId,
            key: item.key,
            displayName: item.displayName,
            inputType: item.inputType,
            isRequired: item.isRequired,
            placeholder: item.placeholder || '',
            defaultValue: item.defaultValue || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const request: UpdateAiModelSettingDefinitionRequest = {
                    key: this.form.key,
                    displayName: this.form.displayName,
                    inputType: this.form.inputType,
                    isRequired: this.form.isRequired,
                    placeholder: this.form.placeholder,
                    defaultValue: this.form.defaultValue,
                    sortOrder: Number(this.form.sortOrder),
                    isActive: this.form.isActive,
                };
                await this.aiService.updateModelSettingDefinition(this.selectedItem.id, request);
            } else {
                const request: CreateAiModelSettingDefinitionRequest = {
                    aiModelId: this.form.aiModelId,
                    key: this.form.key,
                    displayName: this.form.displayName,
                    inputType: this.form.inputType,
                    isRequired: this.form.isRequired,
                    placeholder: this.form.placeholder,
                    defaultValue: this.form.defaultValue,
                    sortOrder: Number(this.form.sortOrder),
                    isActive: this.form.isActive,
                };
                await this.aiService.createModelSettingDefinition(request);
            }

            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('AiModelSettingDefinitions save error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: AiModelSettingDefinition): Promise<void> {
        if (!confirm(`"${item.displayName}" ayar tanımını silmek istediğinize emin misiniz?`)) return;

        try {
            await this.aiService.deleteModelSettingDefinition(item.id);
            await this.loadItems();
        } catch (err) {
            console.error('AiModelSettingDefinitions delete error:', err);
        }
    }

    async toggleActive(item: AiModelSettingDefinition): Promise<void> {
        if (this.togglingId) return;
        const newActive = !item.isActive;
        this.togglingId = item.id;
        try {
            const request: UpdateAiModelSettingDefinitionRequest = {
                key: item.key,
                displayName: item.displayName,
                inputType: item.inputType,
                isRequired: item.isRequired,
                placeholder: item.placeholder ?? '',
                defaultValue: item.defaultValue ?? '',
                sortOrder: Number(item.sortOrder ?? 0),
                isActive: newActive,
            };
            await this.aiService.updateModelSettingDefinition(item.id, request);
            item.isActive = newActive;
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
}

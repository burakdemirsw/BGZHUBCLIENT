import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiModel } from '@/app/core/models/ai-assistant/ai-model.models';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import { AiModelSettingDefinition } from '@/app/core/models/ai-assistant/ai-model-setting-definition.models';
import {
    AiModelSetting,
    CreateAiModelSettingRequest,
    UpdateAiModelSettingRequest,
} from '@/app/core/models/ai-assistant/ai-model-setting.models';

interface AiModelProviderGroup {
    category: string;
    items: AiModel[];
}

@Component({
    selector: 'app-ai-model-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-model-settings.html',
    styleUrls: ['./ai-model-settings.scss'],
})
export class AiModelSettingsPage implements OnInit {
    models: AiModel[] = [];
    providers: AiProvider[] = [];
    providersById: Record<string, AiProvider> = {};
    filteredModels: AiModel[] = [];
    pagedModels: AiModel[] = [];
    groupedPagedModels: AiModelProviderGroup[] = [];

    settingDefinitionsByModel: Record<string, AiModelSettingDefinition[]> = {};
    modelSettingsByModel: Record<string, AiModelSetting[]> = {};

    selectedModel: AiModel | null = null;
    selectedModelSettings: AiModelSettingDefinition[] = [];
    formValues: Record<string, string> = {};

    loading = false;
    showModal = false;
    saving = false;

    filterText = '';
    currentPage = 1;
    pageSize = 12;
    totalPages = 1;
    totalPagesArray: number[] = [];

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

            const [definitionResponses, settingResponses] = await Promise.all([
                Promise.all(this.models.map(model => this.aiService.getModelSettingDefinitionsByModel(model.id).catch(() => null))),
                Promise.all(this.models.map(model => this.aiService.getModelSettingsByModel(model.id).catch(() => null))),
            ]);

            this.settingDefinitionsByModel = {};
            this.modelSettingsByModel = {};

            this.models.forEach((model, index) => {
                const defList = definitionResponses[index]
                    ? this.extractArray<AiModelSettingDefinition>(definitionResponses[index]?.data)
                        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                    : [];
                const settingList = settingResponses[index]
                    ? this.extractArray<AiModelSetting>(settingResponses[index]?.data)
                    : [];

                this.settingDefinitionsByModel[model.id] = defList;
                this.modelSettingsByModel[model.id] = settingList;
            });

            this.filteredModels = [...this.models];
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiModelSettings load error:', err);
            this.models = [];
            this.filteredModels = [];
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
            (this.getProviderName(item.aiProviderId) || '').toLowerCase().includes(filter)
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

    getSettingCount(modelId: string): number {
        return this.settingDefinitionsByModel[modelId]?.length || 0;
    }

    getConfiguredCount(modelId: string): number {
        return this.modelSettingsByModel[modelId]?.length || 0;
    }

    openModelForm(model: AiModel): void {
        this.selectedModel = model;
        this.selectedModelSettings = [
            ...(this.settingDefinitionsByModel[model.id] || []),
        ].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

        const existing = this.modelSettingsByModel[model.id] || [];
        this.formValues = {};

        this.selectedModelSettings.forEach(item => {
            const found = existing.find(setting => setting.key === item.key);
            this.formValues[item.key] = found?.value ?? item.defaultValue ?? (this.isCheckboxType(item.inputType) ? 'false' : '');
        });

        this.showModal = true;
    }

    getInputTypeForValue(inputType?: string): string {
        const normalized = this.normalizeInputType(inputType || 'text');
        if (normalized === 'number') return 'number';
        if (normalized === 'password') return 'password';
        if (normalized === 'email') return 'email';
        if (normalized === 'url') return 'url';
        return 'text';
    }

    isTextAreaType(inputType?: string): boolean {
        return this.normalizeInputType(inputType || '') === 'textarea';
    }

    isCheckboxType(inputType?: string): boolean {
        return this.normalizeInputType(inputType || '') === 'checkbox';
    }

    getCheckboxValue(key: string): boolean {
        const value = (this.formValues[key] || '').toLowerCase();
        return value === 'true' || value === '1' || value === 'yes';
    }

    onCheckboxValueChange(key: string, checked: boolean): void {
        this.formValues[key] = checked ? 'true' : 'false';
    }

    async saveModelSettings(): Promise<void> {
        if (!this.selectedModel) return;

        try {
            for (const field of this.selectedModelSettings) {
                const value = (this.formValues[field.key] || '').trim();
                if (field.isRequired && !this.isCheckboxType(field.inputType) && !value) {
                    alert(`"${field.displayName}" alanı zorunludur.`);
                    return;
                }
            }

            this.saving = true;

            const existing = this.modelSettingsByModel[this.selectedModel.id] || [];
            const requests: Promise<unknown>[] = [];

            for (const field of this.selectedModelSettings) {
                const rawValue = this.formValues[field.key] ?? '';
                const value = this.isCheckboxType(field.inputType)
                    ? (this.getCheckboxValue(field.key) ? 'true' : 'false')
                    : rawValue;
                const existingItem = existing.find(item => item.key === field.key);

                if (existingItem) {
                    const updateRequest: UpdateAiModelSettingRequest = { value };
                    requests.push(this.aiService.updateModelSetting(existingItem.id, updateRequest));
                    continue;
                }

                const shouldCreate = field.isRequired || !!String(value).trim() || this.isCheckboxType(field.inputType);
                if (!shouldCreate) continue;

                const createRequest: CreateAiModelSettingRequest = {
                    aiModelId: this.selectedModel.id,
                    aiModelSettingDefinitionId: field.id,
                    value,
                };
                requests.push(this.aiService.createModelSetting(createRequest));
            }

            await Promise.all(requests);

            const refreshed = await this.aiService.getModelSettingsByModel(this.selectedModel.id);
            this.modelSettingsByModel[this.selectedModel.id] = this.extractArray<AiModelSetting>(refreshed?.data);

            this.showModal = false;
        } catch (err) {
            console.error('AiModelSettings save error:', err);
        } finally {
            this.saving = false;
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedModel = null;
        this.selectedModelSettings = [];
        this.formValues = {};
    }

    private normalizeInputType(inputType: string): string {
        return (inputType || 'text').toLowerCase().trim();
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

    private extractArray<T>(response: unknown): T[] {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== 'object') return [];

        const source = response as {
            data?: unknown;
            items?: unknown;
            result?: unknown;
            $values?: unknown;
        };

        if (Array.isArray(source.$values)) return source.$values as T[];
        if (Array.isArray(source.items)) return source.items as T[];
        if (Array.isArray(source.result)) return source.result as T[];
        if (Array.isArray(source.data)) return source.data as T[];

        if (source.data && typeof source.data === 'object') {
            const nested = source.data as { items?: unknown; $values?: unknown };
            if (Array.isArray(nested.items)) return nested.items as T[];
            if (Array.isArray(nested.$values)) return nested.$values as T[];
        }

        return [];
    }
}

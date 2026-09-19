import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import { AiProviderSettingDefinition } from '@/app/core/models/ai-assistant/ai-provider-setting-definition.models';
import {
    AiProviderSettingValue,
    CreateAiProviderSettingValueRequest,
    UpdateAiProviderSettingValueRequest,
} from '@/app/core/models/ai-assistant/ai-provider-setting-value.models';

@Component({
    selector: 'app-ai-provider-settings-values-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-provider-settings-values.html',
    styleUrls: ['./ai-provider-settings-values.scss'],
})
export class AiProviderSettingsValuesPage implements OnInit {
    providers: AiProvider[] = [];
    filteredProviders: AiProvider[] = [];
    pagedProviders: AiProvider[] = [];

    settingDefinitionsByProvider: Record<string, AiProviderSettingDefinition[]> = {};
    providerSettingsByProvider: Record<string, AiProviderSettingValue[]> = {};

    selectedProvider: AiProvider | null = null;
    selectedProviderSettings: AiProviderSettingDefinition[] = [];
    formValues: Record<string, string> = {};
    visiblePasswords: Record<string, boolean> = {};

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
            const response = await this.aiService.getProvidersPaged({ pageNumber: 1, pageSize: 1000, companyId });
            this.providers = this.extractArray<AiProvider>(response?.data);

            const [definitionResponses, settingResponses] = await Promise.all([
                Promise.all(this.providers.map(provider => this.aiService.getProviderSettingDefinitionsByProvider(provider.id).catch(() => null))),
                Promise.all(this.providers.map(provider => this.aiService.getProviderSettingValuesByProvider(provider.id).catch(() => null))),
            ]);

            this.settingDefinitionsByProvider = {};
            this.providerSettingsByProvider = {};

            this.providers.forEach((provider, index) => {
                const defList = definitionResponses[index]
                    ? this.extractArray<AiProviderSettingDefinition>(definitionResponses[index]?.data)
                        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                    : [];
                const settingList = settingResponses[index]
                    ? this.extractArray<AiProviderSettingValue>(settingResponses[index]?.data)
                    : [];

                this.settingDefinitionsByProvider[provider.id] = defList;
                this.providerSettingsByProvider[provider.id] = settingList;
            });

            this.filteredProviders = [...this.providers];
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiProviderSettingsValues load error:', err);
            this.providers = [];
            this.filteredProviders = [];
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
        this.filteredProviders = this.providers.filter(item =>
            (item.firmDescription || '').toLowerCase().includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredProviders.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedProviders = this.filteredProviders.slice(start, start + this.pageSize);
    }

    getSettingCount(providerId: string): number {
        return this.settingDefinitionsByProvider[providerId]?.length || 0;
    }

    getConfiguredCount(providerId: string): number {
        return this.providerSettingsByProvider[providerId]?.length || 0;
    }

    openProviderForm(provider: AiProvider): void {
        this.selectedProvider = provider;
        this.selectedProviderSettings = [
            ...(this.settingDefinitionsByProvider[provider.id] || []),
        ].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));

        const existing = this.providerSettingsByProvider[provider.id] || [];
        this.formValues = {};
        this.visiblePasswords = {};

        this.selectedProviderSettings.forEach(item => {
            const found = existing.find(setting => setting.key === item.key);
            this.formValues[item.key] = found?.value ?? item.defaultValue ?? (this.isCheckboxType(item.inputType) ? 'false' : '');
        });

        this.showModal = true;
    }

    getInputTypeForValue(inputType?: string, key?: string): string {
        const normalized = this.normalizeInputType(inputType || 'text');
        if (normalized === 'password') return key && this.visiblePasswords[key] ? 'text' : 'password';
        if (normalized === 'number') return 'number';
        if (normalized === 'email') return 'email';
        if (normalized === 'url') return 'url';
        return 'text';
    }

    isTextAreaType(inputType?: string): boolean {
        return this.normalizeInputType(inputType || '') === 'textarea';
    }

    isPasswordType(inputType?: string): boolean {
        return this.normalizeInputType(inputType || '') === 'password';
    }

    togglePasswordVisibility(key: string): void {
        this.visiblePasswords[key] = !this.visiblePasswords[key];
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

    async saveProviderSettings(): Promise<void> {
        if (!this.selectedProvider) return;

        try {
            for (const field of this.selectedProviderSettings) {
                const value = (this.formValues[field.key] || '').trim();
                if (field.isRequired && !this.isCheckboxType(field.inputType) && !value) {
                    alert(`"${field.displayName}" alanı zorunludur.`);
                    return;
                }
            }

            this.saving = true;

            const existing = this.providerSettingsByProvider[this.selectedProvider.id] || [];
            const requests: Promise<unknown>[] = [];

            for (const field of this.selectedProviderSettings) {
                const rawValue = this.formValues[field.key] ?? '';
                const value = this.isCheckboxType(field.inputType)
                    ? (this.getCheckboxValue(field.key) ? 'true' : 'false')
                    : rawValue;
                const existingItem = existing.find(item => item.key === field.key);

                if (existingItem) {
                    const updateRequest: UpdateAiProviderSettingValueRequest = { value };
                    requests.push(this.aiService.updateProviderSettingValue(existingItem.id, updateRequest));
                    continue;
                }

                const shouldCreate = field.isRequired || !!String(value).trim() || this.isCheckboxType(field.inputType);
                if (!shouldCreate) continue;

                const createRequest: CreateAiProviderSettingValueRequest = {
                    aiProviderId: this.selectedProvider.id,
                    aiProviderSettingDefinitionId: field.id,
                    value,
                };
                requests.push(this.aiService.createProviderSettingValue(createRequest));
            }

            await Promise.all(requests);

            const refreshed = await this.aiService.getProviderSettingValuesByProvider(this.selectedProvider.id);
            this.providerSettingsByProvider[this.selectedProvider.id] = this.extractArray<AiProviderSettingValue>(refreshed?.data);

            this.showModal = false;
        } catch (err) {
            console.error('AiProviderSettingsValues save error:', err);
        } finally {
            this.saving = false;
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedProvider = null;
        this.selectedProviderSettings = [];
        this.formValues = {};
        this.visiblePasswords = {};
    }

    private normalizeInputType(inputType: string): string {
        return (inputType || 'text').toLowerCase().trim();
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

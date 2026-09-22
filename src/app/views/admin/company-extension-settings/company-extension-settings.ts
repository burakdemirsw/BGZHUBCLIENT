import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import { ExtensionSettingDefinition } from '@/app/core/models/extension/extension-setting-definition.models';
import {
    CompanyExtensionSetting,
    CreateCompanyExtensionSettingRequest,
    UpdateCompanyExtensionSettingRequest,
} from '@/app/core/models/extension/company-extension-setting.models';
import { CompanyExtension } from '@/app/core/models/extension/company-extension.models';
import { ExtensionSettingCategory } from '@/app/core/models/extension/extension-setting-category.models';

interface ExtensionCategoryGroup {
    category: string;
    items: ExtensionDefinition[];
}

/** Modalda ayar alanlarının Extension Ayar Kategorilerine göre gruplanmış hali */
interface SettingFieldGroup {
    code: string;
    name: string;
    description: string | null;
    sortOrder: number;
    fields: ExtensionSettingDefinition[];
}

@Component({
    selector: 'app-company-extension-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './company-extension-settings.html',
    styleUrls: ['./company-extension-settings.scss'],
})
export class CompanyExtensionSettingsPage implements OnInit {
    definitions: ExtensionDefinition[] = [];
    filteredExtensions: ExtensionDefinition[] = [];
    pagedExtensions: ExtensionDefinition[] = [];
    groupedPagedExtensions: ExtensionCategoryGroup[] = [];

    settingDefinitionsByExtension: Record<string, ExtensionSettingDefinition[]> = {};
    companySettingsByExtension: Record<string, CompanyExtensionSetting[]> = {};
    companyExtensions: CompanyExtension[] = [];
    enabledExtensionIds = new Set<string>();

    selectedExtension: ExtensionDefinition | null = null;
    selectedExtensionSettings: ExtensionSettingDefinition[] = [];
    selectedSettingGroups: SettingFieldGroup[] = [];
    settingCategories: ExtensionSettingCategory[] = [];
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
        private extensionService: ExtensionManagementService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadPageData();
    }

    async loadPageData(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const [response, categoryResponse] = await Promise.all([
                this.extensionService.getExtensionDefinitions(),
                this.extensionService.getExtensionSettingCategories().catch(() => null),
            ]);
            this.definitions = this.extractArray<ExtensionDefinition>(response);
            this.settingCategories = this.extractArray<ExtensionSettingCategory>(categoryResponse);

            if (!companyId) {
                this.filteredExtensions = [...this.definitions];
                this.applyFilterAndPaging();
                return;
            }

            const [settingDefinitionResponses, companySettingResponses] = await Promise.all([
                Promise.all(
                    this.definitions.map(definition =>
                        this.extensionService.getExtensionSettingDefinitions(definition.id).catch(() => null)
                    )
                ),
                Promise.all(
                    this.definitions.map(definition =>
                        this.extensionService.getCompanyExtensionSettings(companyId, definition.id).catch(() => null)
                    )
                ),
            ]);

            const companyExtensionsResponse = await this.extensionService.getCompanyExtensions(companyId);
            this.companyExtensions = this.extractArray<CompanyExtension>(companyExtensionsResponse);
            this.enabledExtensionIds = new Set(
                this.companyExtensions
                    .filter(item => item.isEnabled)
                    .map(item => item.extensionId)
            );

            this.settingDefinitionsByExtension = {};
            this.companySettingsByExtension = {};

            this.definitions.forEach((definition, index) => {
                const schemaList = settingDefinitionResponses[index]
                    ? this.extractArray<ExtensionSettingDefinition>(settingDefinitionResponses[index])
                        .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder))
                    : [];

                const settingsList = companySettingResponses[index]
                    ? this.extractArray<CompanyExtensionSetting>(companySettingResponses[index])
                    : [];

                this.settingDefinitionsByExtension[definition.id] = schemaList;
                this.companySettingsByExtension[definition.id] = settingsList;
            });

            this.filteredExtensions = [...this.definitions];
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('ExtensionDefinitions load error:', err);
            this.definitions = [];
            this.filteredExtensions = [];
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
        this.filteredExtensions = this.definitions.filter(item =>
            this.isExtensionEnabled(item.id) && (
                (item.name || '').toLowerCase().includes(filter) ||
                (item.code || '').toLowerCase().includes(filter) ||
                (item.category || '').toLowerCase().includes(filter)
            )
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredExtensions.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedExtensions = this.filteredExtensions.slice(start, start + this.pageSize);
        this.groupedPagedExtensions = this.buildCategoryGroups(this.pagedExtensions);
    }

    getExtensionPhotoUrl(extension: ExtensionDefinition): string {
        return extension.photoUrl || '';
    }

    getSettingCount(extensionId: string): number {
        return this.settingDefinitionsByExtension[extensionId]?.length || 0;
    }

    getConfiguredCount(extensionId: string): number {
        return this.companySettingsByExtension[extensionId]?.length || 0;
    }

    isExtensionEnabled(extensionId: string): boolean {
        return this.enabledExtensionIds.has(extensionId);
    }

    openExtensionForm(extension: ExtensionDefinition): void {
        this.selectedExtension = extension;
        this.selectedExtensionSettings = [
            ...(this.settingDefinitionsByExtension[extension.id] || []),
        ].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
        this.selectedSettingGroups = this.buildSettingGroups(this.selectedExtensionSettings);

        const existing = this.companySettingsByExtension[extension.id] || [];
        this.formValues = {};

        this.selectedExtensionSettings.forEach(item => {
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

    async saveExtensionSettings(): Promise<void> {
        if (!this.selectedExtension) return;

        try {
            for (const field of this.selectedExtensionSettings) {
                const value = (this.formValues[field.key] || '').trim();
                if (field.isRequired && !this.isCheckboxType(field.inputType) && !value) {
                    alert(`"${field.displayName}" alani zorunludur.`);
                    return;
                }
            }

            const companyId = this.authStateService.profile?.companyId || '';
            if (!companyId) return;

            this.saving = true;

            const existing = this.companySettingsByExtension[this.selectedExtension.id] || [];
            const requests: Promise<unknown>[] = [];

            for (const field of this.selectedExtensionSettings) {
                const rawValue = this.formValues[field.key] ?? '';
                const value = this.isCheckboxType(field.inputType)
                    ? (this.getCheckboxValue(field.key) ? 'true' : 'false')
                    : rawValue;
                const existingItem = existing.find(item => item.key === field.key);

                if (existingItem) {
                    const updateRequest: UpdateCompanyExtensionSettingRequest = { value };
                    requests.push(this.extensionService.updateCompanyExtensionSetting(existingItem.id, updateRequest));
                    continue;
                }

                const shouldCreate = field.isRequired || !!String(value).trim() || this.isCheckboxType(field.inputType);
                if (!shouldCreate) continue;

                const createRequest: CreateCompanyExtensionSettingRequest = {
                    companyId,
                    extensionId: this.selectedExtension.id,
                    key: field.key,
                    value,
                };
                requests.push(this.extensionService.createCompanyExtensionSetting(createRequest));
            }

            await Promise.all(requests);

            const refreshed = await this.extensionService.getCompanyExtensionSettings(companyId, this.selectedExtension.id);
            this.companySettingsByExtension[this.selectedExtension.id] = this.extractArray<CompanyExtensionSetting>(refreshed);

            this.showModal = false;
        } catch (err) {
            console.error('CompanyExtensionSettings save error:', err);
        } finally {
            this.saving = false;
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedExtension = null;
        this.selectedExtensionSettings = [];
        this.selectedSettingGroups = [];
        this.formValues = {};
    }

    /** Alanları kategori sırasına, kategori içinde alan sırasına göre gruplar; kategorisiz alanlar en sonda "Genel" altında toplanır. */
    private buildSettingGroups(fields: ExtensionSettingDefinition[]): SettingFieldGroup[] {
        const groups = new Map<string, SettingFieldGroup>();

        for (const field of fields) {
            const code = (field.categoryCode || '').trim().toLowerCase();
            let group = groups.get(code);
            if (!group) {
                const category = code ? this.settingCategories.find(c => (c.code || '').toLowerCase() === code) : undefined;
                group = {
                    code,
                    name: category?.name || field.categoryName || field.categoryCode || 'Genel',
                    description: category?.description ?? null,
                    sortOrder: category ? Number(category.sortOrder) || 0 : Number.MAX_SAFE_INTEGER,
                    fields: [],
                };
                groups.set(code, group);
            }
            group.fields.push(field);
        }

        return Array.from(groups.values())
            .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'tr-TR'));
    }

    private normalizeInputType(inputType: string): string {
        return (inputType || 'text').toLowerCase().trim();
    }

    private buildCategoryGroups(items: ExtensionDefinition[]): ExtensionCategoryGroup[] {
        const groups: Record<string, ExtensionDefinition[]> = {};

        items.forEach(item => {
            const category = (item.category || '').trim() || 'Diger';
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

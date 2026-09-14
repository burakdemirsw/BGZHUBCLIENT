import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import {
    ExtensionSettingDefinition,
    CreateExtensionSettingDefinitionRequest,
    UpdateExtensionSettingDefinitionRequest,
} from '@/app/core/models/extension/extension-setting-definition.models';

interface ExtensionSettingDefinitionForm {
    extensionId: string;
    key: string;
    displayName: string;
    inputType: string;
    isRequired: boolean;
    placeholder: string;
    defaultValue: string;
    sortOrder: number;
    isActive: boolean;
}

interface ExtensionCategoryGroup {
    category: string;
    items: ExtensionDefinition[];
}

@Component({
    selector: 'app-extension-setting-definitions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './extension-setting-definitions.html',
    styleUrls: ['./extension-setting-definitions.scss'],
})
export class ExtensionSettingDefinitionsPage implements OnInit {
    definitions: ExtensionDefinition[] = [];
    items: ExtensionSettingDefinition[] = [];

    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: ExtensionSettingDefinition | null = null;

    selectedExtensionId = '';
    extensionFilterText = '';

    filterText = '';
    filteredItems: ExtensionSettingDefinition[] = [];
    pagedItems: ExtensionSettingDefinition[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: ExtensionSettingDefinitionForm = {
        extensionId: '',
        key: '',
        displayName: '',
        inputType: 'text',
        isRequired: false,
        placeholder: '',
        defaultValue: '',
        sortOrder: 0,
        isActive: true,
    };

    inputTypeOptions = [
        'text',
        'textarea',
        'number',
        'password',
        'email',
        'url',
        'select',
        'checkbox',
    ];

    constructor(private extensionService: ExtensionManagementService) {}

    ngOnInit(): void {
        this.loadDefinitions();
    }

    async loadDefinitions(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.extensionService.getExtensionDefinitions();
            this.definitions = this.extractArray<ExtensionDefinition>(response);

            if (!this.selectedExtensionId && this.definitions.length > 0) {
                this.selectedExtensionId = this.definitions[0].id;
            }

            await this.loadItems();
        } catch (err) {
            console.error('ExtensionSettingDefinitions definitions load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadItems(): Promise<void> {
        if (!this.selectedExtensionId) {
            this.items = [];
            this.applyFilterAndPaging();
            return;
        }

        this.loading = true;
        try {
            const response = await this.extensionService.getExtensionSettingDefinitions(this.selectedExtensionId);
            this.items = this.extractArray<ExtensionSettingDefinition>(response)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('ExtensionSettingDefinitions load error:', err);
            this.items = [];
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    onExtensionChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    selectExtension(extensionId: string): void {
        if (!extensionId || this.selectedExtensionId === extensionId) return;
        this.selectedExtensionId = extensionId;
        this.currentPage = 1;
        this.loadItems();
    }

    isExtensionSelected(extensionId: string): boolean {
        return this.selectedExtensionId === extensionId;
    }

    get filteredDefinitions(): ExtensionDefinition[] {
        const filter = (this.extensionFilterText || '').toLowerCase().trim();
        if (!filter) {
            return this.definitions;
        }

        return this.definitions.filter((extension) =>
            (extension.name || '').toLowerCase().includes(filter)
            || (extension.code || '').toLowerCase().includes(filter)
            || (extension.category || '').toLowerCase().includes(filter)
            || (extension.mention || '').toLowerCase().includes(filter),
        );
    }

    get groupedFilteredDefinitions(): ExtensionCategoryGroup[] {
        const groups = new Map<string, ExtensionDefinition[]>();

        for (const extension of this.filteredDefinitions) {
            const category = (extension.category || '').trim() || 'Diger';
            const list = groups.get(category) || [];
            list.push(extension);
            groups.set(category, list);
        }

        return Array.from(groups.entries())
            .map(([category, items]) => ({
                category,
                items: [...items].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr-TR')),
            }))
            .sort((a, b) => a.category.localeCompare(b.category, 'tr-TR'));
    }

    get selectedExtensionName(): string {
        const selected = this.definitions.find((extension) => extension.id === this.selectedExtensionId);
        return selected?.name || 'Secili extension yok';
    }

    getExtensionPhotoUrl(extension: ExtensionDefinition): string | undefined {
        const photo = (extension.photoUrl || '').trim();
        return photo || undefined;
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
            (item.inputType || '').toLowerCase().includes(filter) ||
            (item.placeholder || '').toLowerCase().includes(filter) ||
            (item.defaultValue || '').toLowerCase().includes(filter)
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
            extensionId: this.selectedExtensionId,
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

    openEdit(item: ExtensionSettingDefinition): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            extensionId: item.extensionId,
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
                const request: UpdateExtensionSettingDefinitionRequest = {
                    key: this.form.key,
                    displayName: this.form.displayName,
                    inputType: this.form.inputType,
                    isRequired: this.form.isRequired,
                    placeholder: this.form.placeholder,
                    defaultValue: this.form.defaultValue,
                    sortOrder: Number(this.form.sortOrder),
                    isActive: this.form.isActive,
                };
                await this.extensionService.updateExtensionSettingDefinition(this.selectedItem.id, request);
            } else {
                const request: CreateExtensionSettingDefinitionRequest = {
                    extensionId: this.form.extensionId,
                    key: this.form.key,
                    displayName: this.form.displayName,
                    inputType: this.form.inputType,
                    isRequired: this.form.isRequired,
                    placeholder: this.form.placeholder,
                    defaultValue: this.form.defaultValue,
                    sortOrder: Number(this.form.sortOrder),
                    isActive: this.form.isActive,
                };
                await this.extensionService.createExtensionSettingDefinition(request);
            }

            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('ExtensionSettingDefinitions save error:', err);
        }
    }

    async deleteItem(item: ExtensionSettingDefinition): Promise<void> {
        if (!confirm(`"${item.displayName}" kaydini silmek istediginize emin misiniz?`)) return;

        try {
            await this.extensionService.deleteExtensionSettingDefinition(item.id);
            await this.loadItems();
        } catch (err) {
            console.error('ExtensionSettingDefinitions delete error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    async copyKey(item: ExtensionSettingDefinition): Promise<void> {
        try {
            const request: CreateExtensionSettingDefinitionRequest = {
                extensionId: item.extensionId,
                key: this.buildCopiedKey(item.key),
                displayName: item.displayName,
                inputType: item.inputType,
                isRequired: item.isRequired,
                placeholder: item.placeholder || '',
                defaultValue: item.defaultValue || '',
                sortOrder: Number(item.sortOrder ?? 0) + 1,
                isActive: item.isActive,
            };

            await this.extensionService.createExtensionSettingDefinition(request);
            await this.loadItems();
        } catch (err) {
            console.error('Key satiri kopyalanamadi:', err);
        }
    }

    private buildCopiedKey(baseKey: string): string {
        const normalizedBase = (baseKey || '').trim();
        const fallbackBase = normalizedBase || 'newkey';
        const initialKey = `${fallbackBase}copy`;

        const existingKeys = new Set(
            this.items
                .map((item) => (item.key || '').toLowerCase())
                .filter((itemKey) => itemKey.length > 0),
        );

        if (!existingKeys.has(initialKey.toLowerCase())) {
            return initialKey;
        }

        let counter = 2;
        while (existingKeys.has(`${initialKey}${counter}`.toLowerCase())) {
            counter += 1;
        }

        return `${initialKey}${counter}`;
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

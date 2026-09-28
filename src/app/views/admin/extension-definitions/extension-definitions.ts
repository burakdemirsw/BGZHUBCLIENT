import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ExtensionDefinition,
    CreateExtensionDefinitionRequest,
    UpdateExtensionDefinitionRequest,
} from '@/app/core/models/extension/extension-definition.models';
import { ExtensionCategory } from '@/app/core/models/extension/extension-category.models';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';

interface ExtensionDefinitionForm {
    code: string;
    name: string;
    categoryCode: string;
    mention: string;
    photoUrl: string;
    isActive: boolean;
}

@Component({
    selector: 'app-extension-definitions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './extension-definitions.html',
    styleUrls: ['./extension-definitions.scss'],
})
export class ExtensionDefinitionsPage implements OnInit {
    items: ExtensionDefinition[] = [];
    categories: ExtensionCategory[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: ExtensionDefinition | null = null;

    filterText = '';
    filteredItems: ExtensionDefinition[] = [];
    pagedItems: ExtensionDefinition[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: ExtensionDefinitionForm = {
        code: '',
        name: '',
        categoryCode: '',
        mention: '',
        photoUrl: '',
        isActive: true,
    };
   
    constructor(private extensionService: ExtensionManagementService) {}

    ngOnInit(): void {
        this.loadCategories();
        this.loadItems();
    }

    async loadCategories(): Promise<void> {
        try {
            const response = await this.extensionService.getExtensionCategories();
            this.categories = this.extractArray<ExtensionCategory>(response)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        } catch (err) {
            console.error('ExtensionCategories load error:', err);
            this.categories = [];
        }
    }

    getCategoryName(item: ExtensionDefinition): string {
        return item.categoryName
            || this.categories.find(c => c.code === item.categoryCode)?.name
            || item.categoryCode
            || '-';
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const listResponse = await this.extensionService.getExtensionDefinitions();
            this.items = this.extractArray<ExtensionDefinition>(listResponse);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('ExtensionDefinitions load error:', err);
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
        this.filteredItems = this.items.filter(item =>
            (item.code || '').toLowerCase().includes(filter) ||
            (item.name || '').toLowerCase().includes(filter) ||
            (item.categoryCode || '').toLowerCase().includes(filter) ||
            (item.categoryName || '').toLowerCase().includes(filter) ||
            (item.mention || '').toLowerCase().includes(filter) ||
            (item.photoUrl || '').toLowerCase().includes(filter)
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
            code: '',
            name: '',
            categoryCode: '',
            mention: '',
            photoUrl: '',
            isActive: true,
        };
        this.showModal = true;
    }

    openEdit(item: ExtensionDefinition): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            code: item.code,
            name: item.name,
            categoryCode: item.categoryCode,
            mention: item.mention || '',
            photoUrl: item.photoUrl || '',
            isActive: item.isActive,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        if (!this.form.categoryCode) {
            alert('Kategori seçiniz.');
            return;
        }
        try {
            if (this.editMode && this.selectedItem) {
                const request: UpdateExtensionDefinitionRequest = {
                    name: this.form.name,
                    categoryCode: this.form.categoryCode,
                    mention: this.form.mention || undefined,
                    photoUrl: this.form.photoUrl || undefined,
                    isActive: this.form.isActive,
                };
                await this.extensionService.updateExtensionDefinition(this.selectedItem.id, request);
            } else {
                const request: CreateExtensionDefinitionRequest = {
                    code: this.form.code,
                    name: this.form.name,
                    categoryCode: this.form.categoryCode,
                    mention: this.form.mention || undefined,
                    photoUrl: this.form.photoUrl || undefined,
                    isActive: this.form.isActive,
                };
                await this.extensionService.createExtensionDefinition(request);
            }

            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('ExtensionDefinitions save error:', err);
        }
    }

    async deleteItem(item: ExtensionDefinition): Promise<void> {
        if (!confirm(`"${item.name}" kaydını silmek istediğinize emin misiniz?`)) return;

        try {
            await this.extensionService.deleteExtensionDefinition(item.id);
            await this.loadItems();
        } catch (err) {
            console.error('ExtensionDefinitions delete error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
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

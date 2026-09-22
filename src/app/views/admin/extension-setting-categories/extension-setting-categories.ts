import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    ExtensionSettingCategory,
    CreateExtensionSettingCategoryRequest,
    UpdateExtensionSettingCategoryRequest,
} from '@/app/core/models/extension/extension-setting-category.models';

interface ExtensionSettingCategoryForm {
    code: string;
    name: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
}

@Component({
    selector: 'app-extension-setting-categories-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './extension-setting-categories.html',
    styleUrls: ['./extension-setting-categories.scss'],
})
export class ExtensionSettingCategoriesPage implements OnInit {
    items: ExtensionSettingCategory[] = [];

    loading = false;
    saving = false;
    showModal = false;
    editMode = false;
    selectedItem: ExtensionSettingCategory | null = null;
    togglingId: string | null = null;

    filterText = '';
    filteredItems: ExtensionSettingCategory[] = [];
    pagedItems: ExtensionSettingCategory[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: ExtensionSettingCategoryForm = this.emptyForm();

    constructor(private extensionService: ExtensionManagementService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.extensionService.getExtensionSettingCategories();
            this.items = this.extractArray(response)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder) || (a.name || '').localeCompare(b.name || '', 'tr-TR'));
        } catch (err) {
            console.error('ExtensionSettingCategories load error:', err);
            this.items = [];
        } finally {
            this.applyFilterAndPaging();
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
        const filter = (this.filterText || '').toLocaleLowerCase('tr-TR').trim();
        this.filteredItems = this.items.filter(item =>
            (item.code || '').toLocaleLowerCase('tr-TR').includes(filter) ||
            (item.name || '').toLocaleLowerCase('tr-TR').includes(filter) ||
            (item.description || '').toLocaleLowerCase('tr-TR').includes(filter)
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
        this.form = this.emptyForm();
        this.form.sortOrder = this.items.length
            ? Math.max(...this.items.map(item => Number(item.sortOrder) || 0)) + 1
            : 0;
        this.showModal = true;
    }

    openEdit(item: ExtensionSettingCategory): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            code: item.code,
            name: item.name,
            description: item.description || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    async save(): Promise<void> {
        const name = this.form.name.trim();
        const code = this.form.code.trim().toLowerCase();
        if (!name || (!this.editMode && !code)) {
            alert('Kod ve ad alanlari zorunludur.');
            return;
        }

        this.saving = true;
        try {
            let response: ApiResponse<unknown>;
            if (this.editMode && this.selectedItem) {
                const request: UpdateExtensionSettingCategoryRequest = {
                    name,
                    description: this.form.description.trim() || null,
                    sortOrder: Number(this.form.sortOrder) || 0,
                    isActive: this.form.isActive,
                };
                response = await this.extensionService.updateExtensionSettingCategory(this.selectedItem.id, request);
            } else {
                const request: CreateExtensionSettingCategoryRequest = {
                    code,
                    name,
                    description: this.form.description.trim() || null,
                    sortOrder: Number(this.form.sortOrder) || 0,
                    isActive: this.form.isActive,
                };
                response = await this.extensionService.createExtensionSettingCategory(request);
            }

            if (!response.isSuccess) {
                alert('Kaydedilemedi: ' + (response.innerError || response.errorCode || 'Bilinmeyen hata'));
                return;
            }

            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('ExtensionSettingCategories save error:', err);
            alert('Kaydedilemedi: ' + this.errorMessage(err));
        } finally {
            this.saving = false;
        }
    }

    async toggleActive(item: ExtensionSettingCategory): Promise<void> {
        if (this.togglingId) return;

        this.togglingId = item.id;
        try {
            const request: UpdateExtensionSettingCategoryRequest = {
                name: item.name,
                description: item.description ?? null,
                sortOrder: Number(item.sortOrder) || 0,
                isActive: !item.isActive,
            };
            const response = await this.extensionService.updateExtensionSettingCategory(item.id, request);
            if (!response.isSuccess) {
                alert('Durum guncellenemedi: ' + (response.innerError || response.errorCode || 'Bilinmeyen hata'));
                return;
            }
            item.isActive = !item.isActive;
        } catch (err) {
            console.error('ExtensionSettingCategories toggle error:', err);
            alert('Durum guncellenemedi: ' + this.errorMessage(err));
        } finally {
            this.togglingId = null;
        }
    }

    async deleteItem(item: ExtensionSettingCategory): Promise<void> {
        if (item.settingDefinitionCount > 0) {
            alert(`"${item.name}" kategorisine bagli ${item.settingDefinitionCount} ayar alani var. Once bu alanlari baska kategoriye tasiyin veya silin.`);
            return;
        }
        if (!confirm(`"${item.name}" kategorisini silmek istediginize emin misiniz?`)) return;

        try {
            const response = await this.extensionService.deleteExtensionSettingCategory(item.id);
            if (!response.isSuccess) {
                alert('Silinemedi: ' + (response.innerError || response.errorCode || 'Bilinmeyen hata'));
                return;
            }
            await this.loadItems();
        } catch (err) {
            console.error('ExtensionSettingCategories delete error:', err);
            alert('Silinemedi: ' + this.errorMessage(err));
        }
    }

    private emptyForm(): ExtensionSettingCategoryForm {
        return { code: '', name: '', description: '', sortOrder: 0, isActive: true };
    }

    private errorMessage(err: any): string {
        if (err?.status === 0) return 'Sunucuya baglanilamadi.';
        return (
            err?.error?.innerError ??
            err?.error?.message ??
            err?.error?.title ??
            err?.message ??
            'Bilinmeyen hata'
        );
    }

    private extractArray(response: any): ExtensionSettingCategory[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) {
            if (Array.isArray(response.data)) return response.data;
            if (Array.isArray(response.data.$values)) return response.data.$values;
            if (Array.isArray(response.data.items)) return response.data.items;
            return [response.data];
        }
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

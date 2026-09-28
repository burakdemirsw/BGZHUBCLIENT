import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ClipboardService } from '@/app/core/services/clipboard.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import {
    CompanyExtension,
    CreateCompanyExtensionRequest,
    UpdateCompanyExtensionRequest,
} from '@/app/core/models/extension/company-extension.models';

interface CompanyExtensionForm {
    extensionId: string;
    isEnabled: boolean;
    priority: number;
}

@Component({
    selector: 'app-company-extensions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './company-extensions.html',
    styleUrls: ['./company-extensions.scss'],
})
export class CompanyExtensionsPage implements OnInit {
    items: CompanyExtension[] = [];
    definitions: ExtensionDefinition[] = [];
    createSelectableDefinitions: ExtensionDefinition[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: CompanyExtension | null = null;

    filterText = '';
    filteredItems: CompanyExtension[] = [];
    pagedItems: CompanyExtension[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
    selectedIds = new Set<string>();
    /** Kopyalandi geri bildirimi icin aktif buton anahtari */
    copiedKey: string | null = null;

    form: CompanyExtensionForm = {
        extensionId: '',
        isEnabled: true,
        priority: 0,
    };

    constructor(
        private extensionService: ExtensionManagementService,
        private authStateService: AuthStateService,
        private clipboardService: ClipboardService,
    ) {}

    ngOnInit(): void {
        this.loadDefinitions();
        this.loadItems();
    }

    async loadDefinitions(): Promise<void> {
        try {
            const response = await this.extensionService.getExtensionDefinitions();
            this.definitions = this.extractArray<ExtensionDefinition>(response);
            this.refreshCreateSelectableDefinitions();
        } catch (err) {
            console.error('ExtensionDefinitions load error:', err);
            this.definitions = [];
            this.createSelectableDefinitions = [];
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.authStateService.profile?.companyId || '';
            const response = await this.extensionService.getCompanyExtensions(companyId);
            this.items = this.extractArray<CompanyExtension>(response);
            this.selectedIds.clear();
            this.refreshCreateSelectableDefinitions();
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('CompanyExtensions load error:', err);
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
            this.getExtensionName(item.extensionId).toLowerCase().includes(filter) ||
            String(item.priority).includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    getExtensionName(extensionId: string): string {
        const definition = this.definitions.find(item => item.id === extensionId);
        if (definition?.name) return definition.name;

        const fromList = this.items.find(item => item.extensionId === extensionId);
        return fromList?.extensionName || 'Tanimsiz Extension';
    }

    getExtensionPhotoUrl(item: CompanyExtension): string {
        const definition = this.definitions.find(def => def.id === item.extensionId);
        return definition?.photoUrl || item.photoUrl || '';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.refreshCreateSelectableDefinitions();
        const firstAvailableId = this.createSelectableDefinitions[0]?.id || '';
        this.form = {
            extensionId: firstAvailableId,
            isEnabled: true,
            priority: 0,
        };
        this.showModal = true;
    }

    getExtensionOptionsForForm(): ExtensionDefinition[] {
        if (this.editMode) {
            return this.definitions;
        }
        return this.createSelectableDefinitions;
    }

    openEdit(item: CompanyExtension): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            extensionId: item.extensionId,
            isEnabled: item.isEnabled,
            priority: item.priority,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const request: UpdateCompanyExtensionRequest = {
                    isEnabled: this.form.isEnabled,
                    priority: Number(this.form.priority),
                    photoUrl: undefined,
                };
                await this.extensionService.updateCompanyExtension(this.selectedItem.id, request);
            } else {
                const companyId = this.authStateService.profile?.companyId || '';
                const request: CreateCompanyExtensionRequest = {
                    companyId,
                    extensionId: this.form.extensionId,
                    isEnabled: this.form.isEnabled,
                    priority: Number(this.form.priority),
                    photoUrl: undefined,
                };
                await this.extensionService.createCompanyExtension(request);
            }

            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('CompanyExtensions save error:', err);
        }
    }

    async deleteItem(item: CompanyExtension): Promise<void> {
        if (!confirm(`"${this.getExtensionName(item.extensionId)}" kaydini silmek istediginize emin misiniz?`)) return;

        try {
            await this.extensionService.deleteCompanyExtension(item.id);
            await this.loadItems();
        } catch (err) {
            console.error('CompanyExtensions delete error:', err);
        }
    }

    isSelected(id: string): boolean {
        return this.selectedIds.has(id);
    }

    toggleItemSelection(id: string, selected: boolean): void {
        if (selected) {
            this.selectedIds.add(id);
            return;
        }
        this.selectedIds.delete(id);
    }

    isAllCurrentPageSelected(): boolean {
        return this.pagedItems.length > 0 && this.pagedItems.every(item => this.selectedIds.has(item.id));
    }

    toggleAllCurrentPage(selected: boolean): void {
        this.pagedItems.forEach(item => this.toggleItemSelection(item.id, selected));
    }

    getSelectedCount(): number {
        return this.selectedIds.size;
    }

    async setSelectedPassive(): Promise<void> {
        const selectedItems = this.items.filter(item => this.selectedIds.has(item.id));
        const toDeactivate = selectedItems.filter(item => item.isEnabled);

        if (!selectedItems.length) return;
        if (!toDeactivate.length) {
            alert('Secili kayitlar zaten pasif durumda.');
            return;
        }

        if (!confirm(`${toDeactivate.length} kayit pasif yapilsin mi?`)) return;

        try {
            await Promise.all(
                toDeactivate.map(item => {
                    const request: UpdateCompanyExtensionRequest = {
                        isEnabled: false,
                        priority: Number(item.priority),
                        photoUrl: item.photoUrl,
                    };
                    return this.extensionService.updateCompanyExtension(item.id, request);
                })
            );

            await this.loadItems();
        } catch (err) {
            console.error('CompanyExtensions bulk passive error:', err);
        }
    }

    async setSelectedActive(): Promise<void> {
        const selectedItems = this.items.filter(item => this.selectedIds.has(item.id));
        const toActivate = selectedItems.filter(item => !item.isEnabled);

        if (!selectedItems.length) return;
        if (!toActivate.length) {
            alert('Secili kayitlar zaten aktif durumda.');
            return;
        }

        if (!confirm(`${toActivate.length} kayit aktif yapilsin mi?`)) return;

        try {
            await Promise.all(
                toActivate.map(item => {
                    const request: UpdateCompanyExtensionRequest = {
                        isEnabled: true,
                        priority: Number(item.priority),
                        photoUrl: item.photoUrl,
                    };
                    return this.extensionService.updateCompanyExtension(item.id, request);
                })
            );

            await this.loadItems();
        } catch (err) {
            console.error('CompanyExtensions bulk active error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    /**
     * ID'yi panoya kopyalar. ID ekranda metin olarak gosterilmez;
     * yalnizca teknik kullanim (link olusturma, destek kaydi) icin kopyalanir.
     */
    async copyId(value: string, key: string): Promise<void> {
        if (!value) return;
        try {
            await this.clipboardService.copyText(value);
            this.copiedKey = key;
            setTimeout(() => {
                if (this.copiedKey === key) this.copiedKey = null;
            }, 1500);
        } catch (err) {
            console.error('Copy id error:', err);
            alert('Kopyalama basarisiz oldu.');
        }
    }

    isCopied(key: string): boolean {
        return this.copiedKey === key;
    }

    private refreshCreateSelectableDefinitions(): void {
        const usedIds = new Set(this.items.map(item => item.extensionId));
        this.createSelectableDefinitions = this.definitions.filter(definition => !usedIds.has(definition.id));
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

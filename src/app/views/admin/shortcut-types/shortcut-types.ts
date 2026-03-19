import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShortcutTypesService } from '@/app/core/services/shortcut-types.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ShortcutType, CreateShortcutTypeRequest, UpdateShortcutTypeRequest } from '@/app/core/models/shortcut/shortcut.models';

@Component({
    selector: 'app-shortcut-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './shortcut-types.html',
})
export class ShortcutTypesPage implements OnInit {
    items: ShortcutType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: ShortcutType | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: ShortcutType[] = [];
    pagedItems: ShortcutType[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        name: '',
        description: '',
        colorCode: '',
        isBlocked: false,
    };

    constructor(private shortcutTypesService: ShortcutTypesService, private authState: AuthStateService) {}

    ngOnInit(): void {
        this.loadItems();
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
            (item.name || '').toLowerCase().includes(filter) ||
            (item.description || '').toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.shortcutTypesService.getAll();
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('ShortcutTypes load error:', err);
        } finally {
            this.loading = false;
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

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { name: '', description: '', colorCode: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: ShortcutType): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            name: item.name,
            description: item.description,
            colorCode: item.colorCode || '',
            isBlocked: item.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateShortcutTypeRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    colorCode: this.form.colorCode,
                    isBlocked: this.form.isBlocked,
                };
                await this.shortcutTypesService.update(this.selectedItem.id, req);
            } else {
                const userId = this.authState.profile?.userId || '';
                const req: CreateShortcutTypeRequest = {
                    userId,
                    name: this.form.name,
                    description: this.form.description,
                    colorCode: this.form.colorCode,
                };
                await this.shortcutTypesService.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteItem(item: ShortcutType): Promise<void> {
        if (confirm(`"${item.name}" kısayol tipini silmek istediğinize emin misiniz?`)) {
            try {
                await this.shortcutTypesService.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

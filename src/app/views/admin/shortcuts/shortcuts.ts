import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShortcutsService } from '@/app/core/services/shortcuts.service';
import { ShortcutTypesService } from '@/app/core/services/shortcut-types.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Shortcut, ShortcutType, CreateShortcutRequest, UpdateShortcutRequest } from '@/app/core/models/shortcut/shortcut.models';

@Component({
    selector: 'app-shortcuts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './shortcuts.html',
})
export class ShortcutsPage implements OnInit {
    items: Shortcut[] = [];
    shortcutTypes: ShortcutType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: Shortcut | null = null;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];

    form: any = {
        shortcutTypeId: '',
        name: '',
        shortCode: '',
        content: '',
        isShared: false,
        isBlocked: false,
    };

    constructor(
        private shortcutsService: ShortcutsService,
        private shortcutTypesService: ShortcutTypesService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        await Promise.all([this.loadItems(), this.loadTypes()]);
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.shortcutsService.getPaged({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            //console.log('Shortcuts response:', response);
            
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Shortcuts load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadTypes(): Promise<void> {
        try {
            const response = await this.shortcutTypesService.getAll();
            this.shortcutTypes = this.extractArray(response?.data);
        } catch (err) {
            console.error('ShortcutTypes load error:', err);
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

    getTypeName(shortcutTypeId: string): string {
        if (!shortcutTypeId) return '—';
        const t = this.shortcutTypes.find(st => st.id === shortcutTypeId);
        return t ? t.name : '—';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { shortcutTypeId: '', name: '', shortCode: '', content: '', isShared: false, isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: Shortcut): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            shortcutTypeId: item.shortcutTypeId,
            name: item.name,
            shortCode: item.shortCode,
            content: item.content,
            isShared: item.isShared,
            isBlocked: item.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateShortcutRequest = {
                    shortcutTypeId: this.form.shortcutTypeId,
                    name: this.form.name,
                    shortCode: this.form.shortCode,
                    content: this.form.content,
                    isShared: this.form.isShared,
                    isBlocked: this.form.isBlocked,
                };
                await this.shortcutsService.update(this.selectedItem.id, req);
            } else {
                const userId = this.authState.profile?.userId || '';
                const req: CreateShortcutRequest = {
                    userId,
                    shortcutTypeId: this.form.shortcutTypeId,
                    name: this.form.name,
                    shortCode: this.form.shortCode,
                    content: this.form.content,
                    isShared: this.form.isShared,
                };
                await this.shortcutsService.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteItem(item: Shortcut): Promise<void> {
        if (confirm(`"${item.shortCode}" kısayolunu silmek istediğinize emin misiniz?`)) {
            try {
                await this.shortcutsService.delete(item.id);
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

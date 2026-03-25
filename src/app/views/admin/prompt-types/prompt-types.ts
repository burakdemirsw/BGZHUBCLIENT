import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PromptTypesService } from '@/app/core/services/prompt-types.service';
import { PromptType, CreatePromptTypeRequest, UpdatePromptTypeRequest } from '@/app/core/models/ai-assistant/prompt.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-prompt-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './prompt-types.html',
})
export class PromptTypesPage implements OnInit {
    items: PromptType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: PromptType | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: PromptType[] = [];
    pagedItems: PromptType[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        type: '',
        isBlocked: false,
    };

    constructor(private promptTypesService: PromptTypesService, private authState: AuthStateService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    // ────── Datatable ──────
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
            (item.type || '').toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    // ────── CRUD ──────
    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.promptTypesService.getPaged({ companyId: this.authState.profile?.companyId ?? '', pageNumber: 1, pageSize: 10000 });
            //console.log('PromptTypes response:', response);
            this.items = this.extractArray(response?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('PromptTypes load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { type: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: PromptType): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            type: item.type || '',
            isBlocked: item.isBlocked || false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdatePromptTypeRequest = {
                    type: this.form.type,
                    isBlocked: this.form.isBlocked,
                };
                await this.promptTypesService.update(this.selectedItem.id, req);
            } else {
                const req: CreatePromptTypeRequest = {
                    type: this.form.type,
                };
                await this.promptTypesService.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: PromptType): Promise<void> {
        if (confirm(`"${item.type}" prompt tipini silmek istediğinize emin misiniz?`)) {
            try {
                await this.promptTypesService.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    // ────── Yardımcı ──────
    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

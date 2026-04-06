import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiKnowledgeTypesService } from '@/app/core/services/ai-knowledge-types.service';
import {
    AiKnowledgeTypeResponse,
    CreateAiKnowledgeTypeRequest,
    UpdateAiKnowledgeTypeRequest,
} from '@/app/core/models/ai-assistant/ai-knowledge-type.models';

@Component({
    selector: 'app-ai-knowledge-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-knowledge-types.html',
    styleUrls: ['./ai-knowledge-types.scss'],
})
export class AiKnowledgeTypesPage implements OnInit {
    items: AiKnowledgeTypeResponse[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: AiKnowledgeTypeResponse | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: AiKnowledgeTypeResponse[] = [];
    pagedItems: AiKnowledgeTypeResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;  
    totalPagesArray: number[] = [];

    form: { type: string; isBlocked: boolean } = {
        type: '',
        isBlocked: false,
    };

    constructor(private aiKnowledgeTypesService: AiKnowledgeTypesService) {}

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
            const response = await this.aiKnowledgeTypesService.getAll();
            this.items = this.extractArray(response?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiKnowledgeTypes load error:', err);
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

    openEdit(item: AiKnowledgeTypeResponse): void {
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
                const req: UpdateAiKnowledgeTypeRequest = {
                    type: this.form.type,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiKnowledgeTypesService.update(this.selectedItem.id, req);
            } else {
                const req: CreateAiKnowledgeTypeRequest = {
                    type: this.form.type,
                };
                await this.aiKnowledgeTypesService.create(req);
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

    async deleteItem(item: AiKnowledgeTypeResponse): Promise<void> {
        if (confirm(`"${item.type}" bilgi tipini silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiKnowledgeTypesService.delete(item.id);
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
    private extractArray(response: any): AiKnowledgeTypeResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

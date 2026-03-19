import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SegmentsService } from '@/app/core/services/segments.service';
import { Segment, CreateSegmentRequest, UpdateSegmentRequest } from '@/app/core/models/customer/segment.models';
import { AuthStateService } from '@/app/core/services/auth-state.service';

@Component({
    selector: 'app-segments-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './segments.html',
})
export class SegmentsPage implements OnInit {
    items: Segment[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: Segment[] = [];
    pagedItems: Segment[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: Segment | null = null;
    form: any = {
        name: '', description: '', colorCode: '#6c757d'
    };

    constructor(
        private service: SegmentsService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Segments load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { name: '', description: '', colorCode: '#6c757d' };
        this.showModal = true;
    }

    openEdit(item: Segment): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            name: item.name || '',
            description: item.description || '',
            colorCode: item.colorCode || '#6c757d'
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateSegmentRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    colorCode: this.form.colorCode,
                    isBlocked: this.selectedItem.isBlocked || false
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateSegmentRequest = {
                    userId: this.authStateService.profile?.userId || '',
                    name: this.form.name,
                    description: this.form.description,
                    colorCode: this.form.colorCode
                };
                await this.service.create(req);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    async deleteItem(item: Segment): Promise<void> {
        if (confirm('Bu segmenti silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
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
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.items.filter(
            i =>
                (i.name || '').toLowerCase().includes(q) ||
                (i.description || '').toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

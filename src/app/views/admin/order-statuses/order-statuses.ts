import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderStatusesService } from '@/app/core/services/order-statuses.service';
import { OrderStatus, CreateOrderStatusRequest, UpdateOrderStatusRequest } from '@/app/core/models/order-status/order-status.models';

@Component({
    selector: 'app-order-statuses-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './order-statuses.html',
})
export class OrderStatusesPage implements OnInit {
    items: OrderStatus[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: OrderStatus[] = [];
    pagedItems: OrderStatus[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: OrderStatus | null = null;
    form: any = { name: '', description: '', color: '#3b82f6', sortOrder: 0 };

    constructor(private service: OrderStatusesService) {}

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
            console.error('OrderStatuses load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { name: '', description: '', color: '#3b82f6', sortOrder: 0 };
        this.showModal = true;
    }

    openEdit(item: OrderStatus): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            name: item.name || '',
            description: item.description || '',
            color: item.color || '#3b82f6',
            sortOrder: item.sortOrder ?? 0,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateOrderStatusRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    color: this.form.color,
                    sortOrder: this.form.sortOrder,
                    isBlocked: this.selectedItem.isBlocked || false,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateOrderStatusRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    color: this.form.color,
                    sortOrder: this.form.sortOrder,
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

    async deleteItem(item: OrderStatus): Promise<void> {
        if (confirm('Bu sipariş durumunu silmek istediğinize emin misiniz?')) {
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

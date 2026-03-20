import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentStatusesService } from '@/app/core/services/payment-statuses.service';
import { PaymentStatus, CreatePaymentStatusRequest, UpdatePaymentStatusRequest } from '@/app/core/models/payment-status/payment-status.models';

@Component({
    selector: 'app-payment-statuses-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './payment-statuses.html',
})
export class PaymentStatusesPage implements OnInit {
    items: PaymentStatus[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: PaymentStatus[] = [];
    pagedItems: PaymentStatus[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: PaymentStatus | null = null;
    form: any = { name: '', description: '' };

    constructor(private service: PaymentStatusesService) {}

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
            console.error('PaymentStatuses load error:', err);
        } finally {
            this.loading = false;
        }
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { name: '', description: '' };
        this.showModal = true;
    }

    openEdit(item: PaymentStatus): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            name: item.name || '',
            description: item.description || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdatePaymentStatusRequest = {
                    name: this.form.name,
                    description: this.form.description,
                    isBlocked: this.selectedItem.isBlocked || false,
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreatePaymentStatusRequest = {
                    name: this.form.name,
                    description: this.form.description,
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

    async deleteItem(item: PaymentStatus): Promise<void> {
        if (confirm('Bu ödeme durumunu silmek istediğinize emin misiniz?')) {
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

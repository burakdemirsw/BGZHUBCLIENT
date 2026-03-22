import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerTypesService } from '@/app/core/services/customer-types.service';
import { CustomerType, CreateCustomerTypeRequest, UpdateCustomerTypeRequest } from '@/app/core/models/customer/customer-type.models';

@Component({
    selector: 'app-customer-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-types.html',
})
export class CustomerTypesPage implements OnInit {
    items: CustomerType[] = [];
    loading = false;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: CustomerType | null = null;
    form: any = { name: '', description: '' };

    constructor(private service: CustomerTypesService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('CustomerTypes load error:', err);
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

    openEdit(item: CustomerType): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = { name: item.name || '', description: item.description || '' };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateCustomerTypeRequest = { name: this.form.name, description: this.form.description, isBlocked: this.selectedItem.isBlocked || false };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCustomerTypeRequest = { name: this.form.name, description: this.form.description };
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

    async deleteItem(item: CustomerType): Promise<void> {
        if (confirm('Bu müşteri türünü silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    // ────── Server-side Pagination ──────
    onSearchChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadItems();
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

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerDescriptionsService } from '@/app/core/services/customer-descriptions.service';
import { CustomerDescription, CreateCustomerDescriptionRequest, UpdateCustomerDescriptionRequest } from '@/app/core/models/customer/customer-description.models';
import { Customer } from '@/app/core/models/customer/customer.models';
import { HttpClientService } from '@/app/core/services/http-client.service';

@Component({
    selector: 'app-customer-descriptions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-descriptions.html',
})
export class CustomerDescriptionsPage implements OnInit {
    items: CustomerDescription[] = [];
    customers: Customer[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: CustomerDescription[] = [];
    pagedItems: CustomerDescription[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: CustomerDescription | null = null;
    form: any = { customerId: '', langCode: '', firstName: '', lastName: '', description: '' };

    constructor(
        private service: CustomerDescriptionsService,
        private http: HttpClientService
    ) {}

    ngOnInit(): void {
        this.loadCustomers();
        this.loadItems();
    }

    async loadCustomers(): Promise<void> {
        try {
            const response = await this.http.get_new({ controller: 'Customers' });
            this.customers = this.extractArray(response);
        } catch (err) {
            console.error('Customers load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('CustomerDescriptions load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getCustomerName(customerId?: string): string {
        if (!customerId) return '-';
        const c = this.customers.find(x => x.id === customerId);
        return c ? (c.fullName || c.displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '-') : customerId.substring(0, 8) + '...';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { customerId: '', langCode: '', firstName: '', lastName: '', description: '' };
        this.showModal = true;
    }

    openEdit(item: CustomerDescription): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            customerId: item.customerId || '',
            langCode: item.langCode || '',
            firstName: item.firstName || '',
            lastName: item.lastName || '',
            description: item.description || ''
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateCustomerDescriptionRequest = {
                    customerId: this.form.customerId,
                    langCode: this.form.langCode,
                    firstName: this.form.firstName,
                    lastName: this.form.lastName,
                    description: this.form.description
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCustomerDescriptionRequest = {
                    customerId: this.form.customerId,
                    langCode: this.form.langCode,
                    firstName: this.form.firstName,
                    lastName: this.form.lastName,
                    description: this.form.description
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

    async deleteItem(item: CustomerDescription): Promise<void> {
        if (confirm('Bu müşteri açıklamasını silmek istediğinize emin misiniz?')) {
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
                (i.firstName || '').toLowerCase().includes(q) ||
                (i.lastName || '').toLowerCase().includes(q) ||
                (i.langCode || '').toLowerCase().includes(q) ||
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

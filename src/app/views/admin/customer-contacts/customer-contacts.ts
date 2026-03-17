import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerContactsService } from '@/app/core/services/customer-contacts.service';
import { CustomerContact, CreateCustomerContactRequest, UpdateCustomerContactRequest } from '@/app/core/models/customer/customer-contact.models';
import { Customer } from '@/app/core/models/customer/customer.models';
import { ContactType } from '@/app/core/models/customer/contact-type.models';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { ContactTypesService } from '@/app/core/services/contact-types.service';

@Component({
    selector: 'app-customer-contacts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-contacts.html',
})
export class CustomerContactsPage implements OnInit {
    items: CustomerContact[] = [];
    customers: Customer[] = [];
    contactTypes: ContactType[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: CustomerContact[] = [];
    pagedItems: CustomerContact[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: CustomerContact | null = null;
    form: any = { customerId: '', contactTypeId: '', value: '', isDefault: false };

    constructor(
        private service: CustomerContactsService,
        private contactTypesService: ContactTypesService,
        private http: HttpClientService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
    }

    async loadLookups(): Promise<void> {
        try {
            const [custRes, ctRes] = await Promise.all([
                this.http.get_new({ controller: 'Customers' }),
                this.contactTypesService.getAll(),
            ]);
            this.customers = this.extractArray(custRes);
            this.contactTypes = this.extractArray(ctRes);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('CustomerContacts load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getCustomerName(customerId?: string): string {
        if (!customerId) return '-';
        const c = this.customers.find(x => x.id === customerId);
        return c ? (c.fullName || c.displayName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || '-') : customerId.substring(0, 8) + '...';
    }

    getContactTypeName(id?: string): string {
        if (!id) return '-';
        const ct = this.contactTypes.find(x => x.id === id);
        return ct?.name || '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { customerId: '', contactTypeId: '', value: '', isDefault: false };
        this.showModal = true;
    }

    openEdit(item: CustomerContact): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            customerId: item.customerId || '',
            contactTypeId: item.contactTypeId || '',
            value: item.value || '',
            isDefault: item.isDefault || false
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateCustomerContactRequest = {
                    customerId: this.form.customerId,
                    contactTypeId: this.form.contactTypeId,
                    value: this.form.value,
                    isDefault: this.form.isDefault,
                    isBlocked: this.selectedItem.isBlocked || false
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCustomerContactRequest = {
                    customerId: this.form.customerId,
                    contactTypeId: this.form.contactTypeId,
                    value: this.form.value,
                    isDefault: this.form.isDefault
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

    async deleteItem(item: CustomerContact): Promise<void> {
        if (confirm('Bu müşteri iletişim bilgisini silmek istediğinize emin misiniz?')) {
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
                (i.value || '').toLowerCase().includes(q) ||
                this.getCustomerName(i.customerId).toLowerCase().includes(q) ||
                this.getContactTypeName(i.contactTypeId).toLowerCase().includes(q)
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

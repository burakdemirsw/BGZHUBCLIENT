import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerContactsService } from '@/app/core/services/customer-contacts.service';
import { CustomerContact, CreateCustomerContactRequest, UpdateCustomerContactRequest } from '@/app/core/models/customer/customer-contact.models';
import { CustomerDetailResponse } from '@/app/core/models/customer/customer.models';
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
    customers: CustomerDetailResponse[] = [];
    contactTypes: ContactType[] = [];
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
                this.http.get({ controller: 'Customers' }),
                this.contactTypesService.getPaged({ pageNumber: 1, pageSize: 1000 }),
            ]);
            this.customers = this.extractArray(custRes?.data);
            const ctPaged = ctRes?.data;
            this.contactTypes = ctPaged?.items ?? [];
        } catch (err) {
            console.error('Lookup load error:', err);
        }
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
            console.error('CustomerContacts load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getCustomerName(customerId?: string): string {
        if (!customerId) return '-';
        const c = this.customers.find(x => x.id === customerId);
        return c ? (c.descriptions?.[0] ? `${c.descriptions[0].firstName || ''} ${c.descriptions[0].lastName || ''}`.trim() : `${c.user?.firstName || ''} ${c.user?.lastName || ''}`.trim() || c.platformUsername || '-') : customerId.substring(0, 8) + '...';
    }

    getCustomerDisplayName(customer: CustomerDetailResponse): string {
        const description = customer.descriptions?.[0];
        const descriptionName = description ? `${description.firstName || ''} ${description.lastName || ''}`.trim() : '';
        const userName = `${customer.user?.firstName || ''} ${customer.user?.lastName || ''}`.trim();
        return descriptionName || userName || customer.platformName || customer.platformUsername || customer.user?.email || customer.id.substring(0, 8) + '...';
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

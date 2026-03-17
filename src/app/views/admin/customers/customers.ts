import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '@/app/core/services/customers.service';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest } from '@/app/core/models/customer/customer.models';
import { HttpClientService } from '@/app/core/services/http-client.service';

@Component({
    selector: 'app-customers-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customers.html',
})
export class CustomersPage implements OnInit {
    items: Customer[] = [];
    users: any[] = [];
    socialMediaAccounts: any[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: Customer[] = [];
    pagedItems: Customer[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedItem: Customer | null = null;
    form: any = { userId: '', socialMediaAccountId: '', platformAccountId: '' };

    constructor(
        private service: CustomersService,
        private http: HttpClientService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
    }

    async loadLookups(): Promise<void> {
        try {
            const [usersRes, smaRes] = await Promise.all([
                this.http.get_new({ controller: 'Users' }),
                this.http.get_new({ controller: 'SocialMediaAccounts' }),
            ]);
            this.users = this.extractArray(usersRes);
            this.socialMediaAccounts = this.extractArray(smaRes);
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
            console.error('Customers load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getDisplayName(customer: Customer): string {
        if (customer.fullName) return customer.fullName;
        const combined = `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim();
        if (combined) return combined;
        return customer.displayName ?? customer.customerCode ?? '-';
    }

    getUserName(userId?: string): string {
        if (!userId) return '-';
        const u = this.users.find((x: any) => x.id === userId);
        return u ? (u.fullName || u.userName || u.email || '-') : userId.substring(0, 8) + '...';
    }

    getSocialMediaAccountName(id?: string): string {
        if (!id) return '-';
        const s = this.socialMediaAccounts.find((x: any) => x.id === id);
        return s ? (s.name || s.accountName || '-') : id.substring(0, 8) + '...';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { userId: '', socialMediaAccountId: '', platformAccountId: '' };
        this.showModal = true;
    }

    openEdit(item: Customer): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            userId: item.userId || '',
            socialMediaAccountId: item.socialMediaAccountId || '',
            platformAccountId: item.platformAccountId || '',
            status: item.status ?? 0
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateCustomerRequest = {
                    userId: this.form.userId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    platformAccountId: this.form.platformAccountId,
                    status: this.form.status ?? 0,
                    isBlocked: this.selectedItem.isBlocked || false
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCustomerRequest = {
                    userId: this.form.userId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    platformAccountId: this.form.platformAccountId
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

    async deleteItem(item: Customer): Promise<void> {
        if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
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
                this.getDisplayName(i).toLowerCase().includes(q) ||
                (i.email || '').toLowerCase().includes(q) ||
                (i.phoneNumber || '').toLowerCase().includes(q) ||
                (i.companyName || '').toLowerCase().includes(q) ||
                (i.customerCode || '').toLowerCase().includes(q) ||
                (i.platformAccountId || '').toLowerCase().includes(q)
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

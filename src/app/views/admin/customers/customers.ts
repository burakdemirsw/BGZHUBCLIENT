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
    selectedItem: Customer | null = null;
    form: any = { userId: '', socialMediaAccountId: '', companyId: '', platformAccountId: '' };

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
                this.http.get_new({ controller: 'SocialMedia', action: 'accounts?PageNumber=1&PageSize=1000' }),
            ]);
            this.users = this.extractArray(usersRes?.items || usersRes);
            this.socialMediaAccounts = this.extractArray(smaRes?.items || smaRes);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged(this.currentPage, this.pageSize, this.searchTerm);
            const data = response?.data || response;
            this.items = this.extractArray(data?.items || data);
            this.totalCount = data?.totalCount ?? data?.total ?? this.items.length;
            this.totalPages = data?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
        this.form = { 
            userId: '', 
            socialMediaAccountId: '', 
            companyId: localStorage.getItem('companyId') || '', 
            platformAccountId: '', 
            platformUsername: '', 
            platformName: '' 
        };
        this.showModal = true;
    }

    openEdit(item: Customer): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            userId: item.userId || '',
            socialMediaAccountId: item.socialMediaAccountId || '',
            companyId: item.companyId || localStorage.getItem('companyId') || '',
            platformAccountId: item.platformAccountId || '',
            platformUsername: item.platformUsername || '',
            platformName: item.platformName || '',
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
                    companyId: this.form.companyId || localStorage.getItem('companyId') || '',
                    platformAccountId: this.form.platformAccountId,
                    platformUsername: this.form.platformUsername,
                    platformName: this.form.platformName,
                    status: this.form.status ?? 0,
                    isBlocked: this.selectedItem.isBlocked || false
                };
                await this.service.update(this.selectedItem.id, req);
            } else {
                const req: CreateCustomerRequest = {
                    userId: this.form.userId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    companyId: this.form.companyId || localStorage.getItem('companyId') || '',
                    platformAccountId: this.form.platformAccountId,
                    platformUsername: this.form.platformUsername,
                    platformName: this.form.platformName
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

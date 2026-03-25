import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomersService } from '@/app/core/services/customers.service';
import { CustomerDetailResponse } from '@/app/core/models/customer/customer.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-customers-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customers.html',
})
export class CustomersPage implements OnInit {
    items: CustomerDetailResponse[] = [];
    loading = false;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Detail Modal
    showDetailModal = false;
    selectedItem: CustomerDetailResponse | null = null;

    constructor(
        private service: CustomersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Customers load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getDisplayName(customer: CustomerDetailResponse): string {
        // Önce descriptions'dan al (ilk description'ın firstName + lastName)
        if (customer.descriptions?.length) {
            const desc = customer.descriptions[0];
            const combined = `${desc.firstName ?? ''} ${desc.lastName ?? ''}`.trim();
            if (combined) return combined;
        }
        // Sonra user bilgisinden
        if (customer.user) {
            const combined = `${customer.user.firstName ?? ''} ${customer.user.lastName ?? ''}`.trim();
            if (combined) return combined;
        }
        return customer.platformUsername || '-';
    }

    getUserName(customer: CustomerDetailResponse): string {
        if (customer.user) {
            const name = `${customer.user.firstName ?? ''} ${customer.user.lastName ?? ''}`.trim();
            return name || customer.user.email || '-';
        }
        return '-';
    }

    getSocialMediaAccountName(customer: CustomerDetailResponse): string {
        if (customer.socialMediaAccount) {
            return customer.socialMediaAccount.accountName || customer.socialMediaAccount.platform || '-';
        }
        return '-';
    }

    getCompanyName(customer: CustomerDetailResponse): string {
        return customer.company?.name || '-';
    }

    openDetail(item: CustomerDetailResponse): void {
        this.selectedItem = item;
        this.showDetailModal = true;
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedItem = null;
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

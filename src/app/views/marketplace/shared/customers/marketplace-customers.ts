import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TablePager } from '../table-pager/table-pager';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    MarketplaceCustomerProfile,
    MarketplaceCustomerQuery,
    MarketplaceCustomerResponse,
} from '@/app/core/models/marketplace/marketplace.models';

/**
 * Trendyol / Hepsiburada / Boyner / Beymen müşteri uç noktaları aynı yanıtı döner.
 * Uç nokta sayfalama yapmadığı için filtre ve sayfalama istemci tarafında uygulanır.
 */
@Component({
    selector: 'app-marketplace-customers',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './marketplace-customers.html',
    styleUrls: ['./marketplace-customers.scss'],
})
export class MarketplaceCustomersPage implements OnInit {
    /** İlgili pazaryeri servisinin müşteri metodu */
    @Input({ required: true }) fetch!: (query: MarketplaceCustomerQuery) => Promise<ApiResponse<MarketplaceCustomerResponse>>;

    items: MarketplaceCustomerProfile[] = [];
    loading = false;
    errorMessage = '';
    isTruncated = false;
    scannedOrderCount = 0;

    // Datatable
    filterText = '';
    filteredItems: MarketplaceCustomerProfile[] = [];
    pagedItems: MarketplaceCustomerProfile[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    nameFilter = '';
    phoneFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedCustomer: MarketplaceCustomerProfile | null = null;

    ngOnInit(): void {
        this.load();
    }

    async load(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            const response = await this.fetch({
                name: this.nameFilter.trim() || null,
                phone: this.phoneFilter.trim() || null,
                startDate: this.toIsoDate(this.startDate),
                endDate: this.toIsoDate(this.endDate, true),
            });
            if (!response.isSuccess) {
                this.errorMessage = response.innerError || response.errorCode || 'Müşteriler alınamadı.';
            }
            this.items = this.extractArray(response.data?.customers);
            this.isTruncated = response.data?.isTruncated === true;
            this.scannedOrderCount = Number(response.data?.scannedOrderCount) || 0;
        } catch (err) {
            console.error('Müşteriler yüklenemedi:', err);
            const body = (err as { error?: { innerError?: string; errorCode?: string } })?.error;
            this.errorMessage = body?.innerError || body?.errorCode || 'Müşteriler yüklenemedi.';
            this.items = [];
        } finally {
            this.currentPage = 1;
            this.applyFilterAndPaging();
            this.loading = false;
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    onServerFilterChange(): void {
        this.load();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const term = this.filterText.trim().toLocaleLowerCase('tr');
        this.filteredItems = term
            ? this.items.filter(c => [c.fullName, c.email, c.phone, ...(c.orderNumbers ?? [])]
                .filter(Boolean).join(' ').toLocaleLowerCase('tr').includes(term))
            : [...this.items];
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    clearFilters(): void {
        this.nameFilter = '';
        this.phoneFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.filterText = '';
        this.load();
    }

    openDetail(customer: MarketplaceCustomerProfile): void {
        this.selectedCustomer = customer;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedCustomer = null;
    }

    private extractArray(response: any): MarketplaceCustomerProfile[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    private toIsoDate(value: string, endOfDay = false): string | null {
        if (!value) return null;
        const date = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`);
        return Number.isFinite(date.getTime()) ? date.toISOString() : null;
    }
}

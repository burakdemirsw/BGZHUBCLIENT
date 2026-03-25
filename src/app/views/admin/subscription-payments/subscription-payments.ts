import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionPaymentsService } from '@/app/core/services/subscription-payments.service';
import { SubscriptionPaymentResponse, CreateSubscriptionPaymentRequest } from '@/app/core/models/subscription-payment/subscription-payment.models';

@Component({
    selector: 'app-subscription-payments-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './subscription-payments.html',
})
export class SubscriptionPaymentsPage implements OnInit {
    items: SubscriptionPaymentResponse[] = [];
    loading = false;

    // Server-side pagination
    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private searchTimeout: any = null;

    // Modal
    showModal = false;
    form: any = this.getEmptyForm();

    constructor(private subscriptionPaymentsService: SubscriptionPaymentsService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.subscriptionPaymentsService.getPaged({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
            });
            const pagedData = resp?.data;
            this.items = pagedData?.items ? this.extractArray(pagedData.items) : this.extractArray(resp?.data || resp);
            this.totalCount = pagedData?.totalCount ?? this.items.length;
            this.totalPages = pagedData?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.buildPagesArray();
        } catch (err) {
            console.error('SubscriptionPayments loadItems error:', err);
        } finally {
            this.loading = false;
        }
    }

    private buildPagesArray(): void {
        const maxVisible = 7;
        if (this.totalPages <= maxVisible) {
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } else {
            const pages: number[] = [];
            let start = Math.max(1, this.currentPage - 3);
            let end = Math.min(this.totalPages, this.currentPage + 3);
            if (start === 1) end = Math.min(this.totalPages, maxVisible);
            if (end === this.totalPages) start = Math.max(1, this.totalPages - maxVisible + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            this.totalPagesArray = pages;
        }
    }

    private extractArray(response: any): SubscriptionPaymentResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.items) {
            const items = response.items;
            if (Array.isArray(items)) return items;
            if (items?.$values) return items.$values;
        }
        if (response?.data) {
            const d = response.data;
            if (Array.isArray(d)) return d;
            if (d?.items) return Array.isArray(d.items) ? d.items : [];
        }
        if (response?.result) return Array.isArray(response.result) ? response.result : [];
        return [];
    }

    private getEmptyForm(): any {
        return {
            companyId: '',
            subscriptionId: '',
            amount: 0,
            currency: 'TRY',
            paymentMethod: '',
            paymentDate: '',
            isSuccess: true,
            errorMessage: '',
        };
    }

    // ── Filter & Paging ──
    onFilterChange(): void {
        if (this.searchTimeout) clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.currentPage = 1;
            this.loadItems();
        }, 400);
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadItems();
    }

    // ── CRUD ──
    openCreateModal(): void {
        this.form = this.getEmptyForm();
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            const req: CreateSubscriptionPaymentRequest = {
                companyId: this.form.companyId,
                subscriptionId: this.form.subscriptionId,
                amount: this.form.amount,
                currency: this.form.currency,
                paymentMethod: this.form.paymentMethod,
                paymentDate: this.form.paymentDate,
                isSuccess: this.form.isSuccess,
                errorMessage: this.form.errorMessage,
            };
            await this.subscriptionPaymentsService.create(req);
            this.showModal = false;
            this.loadItems();
        } catch (err) {
            console.error('SubscriptionPayments save error:', err);
        }
    }

    async deleteItem(item: SubscriptionPaymentResponse): Promise<void> {
        if (!confirm(`Bu ödeme kaydını silmek istediğinize emin misiniz?`)) return;
        try {
            await this.subscriptionPaymentsService.delete(item.id);
            this.loadItems();
        } catch (err) {
            console.error('SubscriptionPayments delete error:', err);
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    formatDate(date: string | undefined): string {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('tr-TR');
    }

    formatCurrency(amount: number | undefined, currency?: string): string {
        if (amount == null) return '-';
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount);
    }
}

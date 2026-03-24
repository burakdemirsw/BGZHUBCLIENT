import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdersService } from '@/app/core/services/orders.service';
import { OrderStatusesService } from '@/app/core/services/order-statuses.service';
import { PaymentTypesService } from '@/app/core/services/payment-types.service';
import { OrderWithCustomerResponse, OrderFilterRequest } from '@/app/core/models/order/order.models';

@Component({
    selector: 'app-orders-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './orders.html',
})
export class OrdersPage implements OnInit {
    items: OrderWithCustomerResponse[] = [];
    orderStatuses: any[] = [];
    paymentTypes: any[] = [];
    loading = false;

    // Server-side pagination & filters
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalCount = 0;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Filters
    filterOrderStatusId = '';
    filterPaymentTypeId = '';
    filterStartDate = '';
    filterEndDate = '';
    filterIsCompleted: string = '';
    filterIsCancel: string = '';

    // Detail Modal
    showDetailModal = false;
    selectedItem: OrderWithCustomerResponse | null = null;

    constructor(
        private service: OrdersService,
        private orderStatusesService: OrderStatusesService,
        private paymentTypesService: PaymentTypesService,
        private router: Router
    ) {}

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
    }

    async loadLookups(): Promise<void> {
        try {
            const [statusRes, paymentRes] = await Promise.all([
                this.orderStatusesService.getAll(),
                this.paymentTypesService.getAll(),
            ]);
            this.orderStatuses = this.extractArray(statusRes?.data);
            this.paymentTypes = this.extractArray(paymentRes?.data);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const companyId = profile.companyId || '';

            if (!companyId) {
                console.error('Company ID bulunamadı');
                this.loading = false;
                return;
            }

            const filter: OrderFilterRequest = {
                companyId,
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.searchTerm || undefined,
                orderStatusId: this.filterOrderStatusId || undefined,
                paymentTypeId: this.filterPaymentTypeId || undefined,
                startDate: this.filterStartDate || undefined,
                endDate: this.filterEndDate || undefined,
                isCompleted: this.filterIsCompleted !== '' ? this.filterIsCompleted === 'true' : undefined,
                isCancel: this.filterIsCancel !== '' ? this.filterIsCancel === 'true' : undefined,
            };

            const response = await this.service.getByCompanyPaged(filter);
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = paged?.totalPages ?? Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('Orders load error:', err);
        } finally {
            this.loading = false;
        }
    }

    getOrderStatusName(id?: string): string {
        if (!id) return '-';
        const status = this.orderStatuses.find(x => x.id === id);
        return status?.name || status?.statusName || '-';
    }

    getPaymentTypeName(id?: string): string {
        if (!id) return '-';
        const pt = this.paymentTypes.find(x => x.id === id);
        return pt?.name || pt?.typeName || '-';
    }

    getCustomerName(order: OrderWithCustomerResponse): string {
        return order.customer?.platformUsername || '-';
    }

    getOrderStatusLabel(order: OrderWithCustomerResponse): string {
        return order.orderStatus?.name || '-';
    }

    getPaymentTypeLabel(order: OrderWithCustomerResponse): string {
        return order.paymentType?.name || '-';
    }

    formatCurrency(amount?: number, code?: string): string {
        if (amount == null) return '-';
        const currency = code || 'TRY';
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency }).format(amount);
    }

    formatDate(dateStr?: string): string {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    formatDateTime(dateStr?: string): string {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    goToCreate(): void {
        this.router.navigate(['/admin/orders/create']);
    }

    openDetail(order: OrderWithCustomerResponse): void {
        this.selectedItem = order;
        this.showDetailModal = true;
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedItem = null;
    }

    async deleteItem(order: OrderWithCustomerResponse): Promise<void> {
        if (confirm('Bu siparişi silmek istediğinize emin misiniz?')) {
            try {
                await this.service.delete(order.id);
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

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.filterOrderStatusId = '';
        this.filterPaymentTypeId = '';
        this.filterStartDate = '';
        this.filterEndDate = '';
        this.filterIsCompleted = '';
        this.filterIsCancel = '';
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

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoynerMarketplaceService } from '@/app/core/services/boyner-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { BoynerOrder } from '@/app/core/models/marketplace/boyner.models';

@Component({
    selector: 'app-boyner-orders',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './boyner-orders.html',
    styleUrls: ['./boyner-orders.scss'],
})
export class BoynerOrdersPage extends MarketplacePagedTab<BoynerOrder> {
    private marketplace = inject(BoynerMarketplaceService);

    /** Sipariş tarihleri GMT+3 duvar saatini epoch olarak taşır; UTC ile gösterilince doğru saat çıkar */
    readonly orderTz = 'UTC';

    readonly statusOptions: { value: string; label: string }[] = [
        { value: 'Created', label: 'Yeni' },
        { value: 'Picking', label: 'Hazırlanıyor' },
        { value: 'Invoiced', label: 'Faturalandı' },
        { value: 'Shipped', label: 'Kargoda' },
        { value: 'Delivered', label: 'Teslim Edildi' },
        { value: 'UnDelivered', label: 'Teslim Edilemedi' },
        { value: 'Cancelled', label: 'İptal' },
        { value: 'Returned', label: 'İade' },
        { value: 'UnSupplied', label: 'Tedarik Edilemedi' },
    ];

    statusFilter = '';
    orderNumberFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedOrder: BoynerOrder | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<BoynerOrder>> {
        const data = this.unwrap(await this.marketplace.getOrders({
            orderNumber: this.orderNumberFilter.trim() || null,
            status: this.statusFilter || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            page: page - 1,
            size,
        }));
        return {
            items: this.extractArray(data?.content),
            totalCount: Number(data?.totalElements) || 0,
            totalPages: data?.totalPages ?? null,
        };
    }

    protected searchText(o: BoynerOrder): string {
        return [
            o.orderNumber, o.packageNumber, o.customerFullName, o.customerEmail,
            o.cargoProviderName, this.statusLabel(o.status),
            ...(o.lines ?? []).flatMap(l => [l.productName, l.barcode, l.merchantSku]),
        ].filter(Boolean).join(' ');
    }

    statusLabel(status: string | null | undefined): string {
        return this.statusOptions.find(s => s.value === status)?.label || status || '-';
    }

    statusClass(status: string | null | undefined): string {
        switch (status) {
            case 'Delivered': return 'bg-success-subtle text-success';
            case 'Shipped': return 'bg-info-subtle text-info';
            case 'Cancelled':
            case 'UnDelivered':
            case 'UnSupplied':
            case 'Returned': return 'bg-danger-subtle text-danger';
            case 'Created': return 'bg-warning-subtle text-warning';
            default: return 'bg-primary-subtle text-primary';
        }
    }

    totalQuantity(o: BoynerOrder): number {
        return (o.lines ?? []).reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    }

    clearFilters(): void {
        this.statusFilter = '';
        this.orderNumberFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onServerFilterChange();
    }

    openDetail(order: BoynerOrder): void {
        this.selectedOrder = order;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedOrder = null;
    }
}

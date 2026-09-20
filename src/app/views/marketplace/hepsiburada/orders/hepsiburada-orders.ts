import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HepsiburadaMarketplaceService } from '@/app/core/services/hepsiburada-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { HepsiburadaMoney, HepsiburadaOrderItem } from '@/app/core/models/marketplace/hepsiburada.models';

@Component({
    selector: 'app-hepsiburada-orders',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './hepsiburada-orders.html',
    styleUrls: ['./hepsiburada-orders.scss'],
})
export class HepsiburadaOrdersPage extends MarketplacePagedTab<HepsiburadaOrderItem> {
    private marketplace = inject(HepsiburadaMarketplaceService);

    startDate = '';
    endDate = '';

    showModal = false;
    selectedOrder: HepsiburadaOrderItem | null = null;

    constructor() {
        super();
        // Uç nokta tarih aralığı bekler; varsayılan olarak son 7 gün
        this.resetDates();
    }

    protected async fetchPage(page: number, size: number): Promise<PageResult<HepsiburadaOrderItem>> {
        // Tarih boş bırakıldıysa son 7 gün varsayılır
        if (!this.startDate || !this.endDate) this.resetDates();
        const data = this.unwrap(await this.marketplace.getOrders({
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            offset: (page - 1) * size,
            limit: size,
        }));
        return {
            items: this.extractArray(data?.items),
            totalCount: Number(data?.totalCount) || 0,
            totalPages: data?.pageCount ?? null,
        };
    }

    protected searchText(o: HepsiburadaOrderItem): string {
        return [o.orderNumber, o.customerName, o.name, o.merchantSKU, o.barcode, o.productBarcode, o.cargoCompany, o.status]
            .filter(Boolean).join(' ');
    }

    statusClass(status: string | null | undefined): string {
        switch ((status || '').toLocaleLowerCase('en')) {
            case 'delivered':
                return 'bg-success-subtle text-success';
            case 'shipped':
            case 'intransit':
                return 'bg-info-subtle text-info';
            case 'cancelled':
            case 'cancelledbymerchant':
            case 'cancelledbycustomer':
            case 'undelivered':
            case 'returned':
                return 'bg-danger-subtle text-danger';
            case 'open':
            case 'new':
            case 'packaged':
                return 'bg-warning-subtle text-warning';
            default:
                return 'bg-primary-subtle text-primary';
        }
    }

    money(value: HepsiburadaMoney | null | undefined): string {
        if (!value || value.amount === null || value.amount === undefined) return '-';
        return `${Number(value.amount).toFixed(2)} ${value.currency || ''}`.trim();
    }

    clearFilters(): void {
        this.resetDates();
        this.filterText = '';
        this.onServerFilterChange();
    }

    /** Varsayılan tarih aralığı: son 7 gün */
    private resetDates(): void {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.startDate = this.toInputDate(weekAgo);
        this.endDate = this.toInputDate(today);
    }

    openDetail(order: HepsiburadaOrderItem): void {
        this.selectedOrder = order;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedOrder = null;
    }

    private toInputDate(date: Date): string {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }
}

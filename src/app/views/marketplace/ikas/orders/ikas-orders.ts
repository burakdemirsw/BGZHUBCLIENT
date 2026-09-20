import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IkasMarketplaceService } from '@/app/core/services/ikas-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import {
    IkasOrder,
    IkasOrderLineItem,
    IkasOrderPackage,
    IkasTrackingInfoDetail,
} from '@/app/core/models/marketplace/ikas.models';

@Component({
    selector: 'app-ikas-orders',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ikas-orders.html',
    styleUrls: ['./ikas-orders.scss'],
})
export class IkasOrdersPage extends MarketplacePagedTab<IkasOrder> {
    private marketplace = inject(IkasMarketplaceService);

    orderNumberFilter = '';
    customerEmailFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedOrder: IkasOrder | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<IkasOrder>> {
        const data = this.unwrap(await this.marketplace.getOrders({
            orderNumber: this.orderNumberFilter.trim() || null,
            customerEmail: this.customerEmailFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            page,
            limit: size,
        }));
        return {
            items: this.extractArray(data?.orders),
            totalCount: Number(data?.totalCount) || 0,
            hasNext: data?.hasNext ?? false,
        };
    }

    protected searchText(o: IkasOrder): string {
        return [
            o.orderNumber, o.orderPackageStatus, o.customer?.fullName, o.customer?.email, o.customer?.phone,
            this.cargoCompany(o), o.note,
            ...(o.orderLineItems ?? []).flatMap(l => [l.variant?.name, l.variant?.sku]),
        ].filter(Boolean).join(' ');
    }

    /** Sipariş tarihi: orderedAt yoksa createdAt */
    orderDate(o: IkasOrder): number | null {
        return o.orderedAt ?? o.createdAt ?? null;
    }

    firstPackage(o: IkasOrder): IkasOrderPackage | null {
        return (o.orderPackages ?? [])[0] ?? null;
    }

    trackingInfo(o: IkasOrder): IkasTrackingInfoDetail | null {
        return this.firstPackage(o)?.trackingInfo ?? null;
    }

    cargoCompany(o: IkasOrder): string {
        return this.trackingInfo(o)?.cargoCompany || '';
    }

    firstLine(o: IkasOrder): IkasOrderLineItem | null {
        return (o.orderLineItems ?? [])[0] ?? null;
    }

    totalQuantity(o: IkasOrder): number {
        return (o.orderLineItems ?? []).reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
    }

    statusClass(status: string | null | undefined): string {
        const value = (status || '').toLocaleUpperCase('en');
        if (value.includes('DELIVER')) return 'bg-success-subtle text-success';
        if (value.includes('SHIP') || value.includes('TRANSFER')) return 'bg-info-subtle text-info';
        if (value.includes('CANCEL') || value.includes('REFUND') || value.includes('ERROR')) return 'bg-danger-subtle text-danger';
        if (value.includes('PENDING') || value.includes('WAIT') || value.includes('UNFULFILLED')) return 'bg-warning-subtle text-warning';
        return value ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary';
    }

    clearFilters(): void {
        this.orderNumberFilter = '';
        this.customerEmailFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onServerFilterChange();
    }

    openDetail(order: IkasOrder): void {
        this.selectedOrder = order;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedOrder = null;
    }
}

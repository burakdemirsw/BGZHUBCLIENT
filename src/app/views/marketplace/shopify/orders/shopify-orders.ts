import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopifyCursorTab } from '../shopify-cursor-tab';
import { PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { ShopifyMarketplaceService } from '@/app/core/services/shopify-marketplace.service';
import { ShopifyLineItem, ShopifyMoneyBag, ShopifyOrder } from '@/app/core/models/marketplace/shopify.models';

/** GraphQL'den gelen durum değerleri (displayFinancialStatus / displayFulfillmentStatus) */
const FINANCIAL_LABELS: Record<string, string> = {
    PAID: 'Ödendi',
    PENDING: 'Beklemede',
    AUTHORIZED: 'Provizyon',
    PARTIALLY_PAID: 'Kısmi Ödeme',
    PARTIALLY_REFUNDED: 'Kısmi İade',
    REFUNDED: 'İade Edildi',
    VOIDED: 'İptal',
    EXPIRED: 'Süresi Doldu',
};

const FULFILLMENT_LABELS: Record<string, string> = {
    FULFILLED: 'Gönderildi',
    UNFULFILLED: 'Bekliyor',
    PARTIALLY_FULFILLED: 'Kısmi Gönderim',
    IN_PROGRESS: 'Hazırlanıyor',
    ON_HOLD: 'Beklemede',
    SCHEDULED: 'Planlandı',
    RESTOCKED: 'Stoğa Döndü',
};

@Component({
    selector: 'app-shopify-orders',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './shopify-orders.html',
    styleUrls: ['./shopify-orders.scss'],
})
export class ShopifyOrdersPage extends ShopifyCursorTab<ShopifyOrder> {
    private marketplace = inject(ShopifyMarketplaceService);

    /** Sorguda kullanılan Shopify filtre değerleri (küçük harf) */
    readonly financialOptions: { value: string; label: string }[] = [
        { value: 'paid', label: 'Ödendi' },
        { value: 'pending', label: 'Beklemede' },
        { value: 'authorized', label: 'Provizyon' },
        { value: 'partially_paid', label: 'Kısmi Ödeme' },
        { value: 'partially_refunded', label: 'Kısmi İade' },
        { value: 'refunded', label: 'İade Edildi' },
        { value: 'voided', label: 'İptal' },
    ];

    readonly fulfillmentOptions: { value: string; label: string }[] = [
        { value: 'fulfilled', label: 'Gönderildi' },
        { value: 'unfulfilled', label: 'Bekliyor' },
        { value: 'partial', label: 'Kısmi Gönderim' },
        { value: 'restocked', label: 'Stoğa Döndü' },
    ];

    financialFilter = '';
    fulfillmentFilter = '';
    searchFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedOrder: ShopifyOrder | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<ShopifyOrder>> {
        const data = this.unwrap(await this.marketplace.getOrders({
            financialStatus: this.financialFilter || null,
            fulfillmentStatus: this.fulfillmentFilter || null,
            search: this.searchFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            limit: size,
            after: this.cursorFor(page),
        }));
        this.rememberCursor(page, data?.endCursor);
        return { items: this.extractArray(data?.orders), hasNext: data?.hasNextPage === true };
    }

    protected searchText(order: ShopifyOrder): string {
        return [
            order.name, order.customer?.displayName, order.email, order.phone,
            ...this.lines(order).flatMap(l => [l.title, l.sku, l.variant?.barcode]),
        ].filter(Boolean).join(' ');
    }

    lines(order: ShopifyOrder): ShopifyLineItem[] {
        return (order.lineItems?.edges ?? []).map(edge => edge.node).filter((node): node is ShopifyLineItem => !!node);
    }

    totalQuantity(order: ShopifyOrder): number {
        return this.lines(order).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
    }

    /** Shopify tutarları string döner */
    amount(bag: ShopifyMoneyBag | null | undefined): number | null {
        const value = Number(bag?.shopMoney?.amount);
        return Number.isFinite(value) ? value : null;
    }

    currency(order: ShopifyOrder): string {
        return order.totalPriceSet?.shopMoney?.currencyCode || order.currencyCode || '';
    }

    tracking(order: ShopifyOrder): { number?: string | null; url?: string | null; company?: string | null } | null {
        for (const fulfillment of order.fulfillments ?? []) {
            const info = (fulfillment.trackingInfo ?? [])[0];
            if (info) return info;
        }
        return null;
    }

    financialLabel(status: string | null | undefined): string {
        return status ? FINANCIAL_LABELS[status] || status : '-';
    }

    financialClass(status: string | null | undefined): string {
        switch (status) {
            case 'PAID': return 'bg-success-subtle text-success';
            case 'REFUNDED':
            case 'VOIDED':
            case 'EXPIRED': return 'bg-danger-subtle text-danger';
            case 'PENDING':
            case 'PARTIALLY_PAID':
            case 'PARTIALLY_REFUNDED': return 'bg-warning-subtle text-warning';
            default: return 'bg-info-subtle text-info';
        }
    }

    fulfillmentLabel(status: string | null | undefined): string {
        return status ? FULFILLMENT_LABELS[status] || status : '-';
    }

    fulfillmentClass(status: string | null | undefined): string {
        switch (status) {
            case 'FULFILLED': return 'bg-success-subtle text-success';
            case 'RESTOCKED': return 'bg-danger-subtle text-danger';
            case 'UNFULFILLED':
            case 'ON_HOLD': return 'bg-warning-subtle text-warning';
            default: return 'bg-info-subtle text-info';
        }
    }

    clearFilters(): void {
        this.financialFilter = '';
        this.fulfillmentFilter = '';
        this.searchFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onServerFilterChange();
    }

    openDetail(order: ShopifyOrder): void {
        this.selectedOrder = order;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedOrder = null;
    }
}

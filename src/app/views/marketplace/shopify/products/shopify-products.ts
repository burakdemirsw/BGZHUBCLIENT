import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopifyCursorTab } from '../shopify-cursor-tab';
import { PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { ShopifyMarketplaceService } from '@/app/core/services/shopify-marketplace.service';
import { ShopifyInventoryLevel, ShopifyProduct, ShopifyProductVariant } from '@/app/core/models/marketplace/shopify.models';

const STATUS_LABELS: Record<string, string> = {
    ACTIVE: 'Yayında',
    DRAFT: 'Taslak',
    ARCHIVED: 'Arşiv',
};

@Component({
    selector: 'app-shopify-products',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './shopify-products.html',
    styleUrls: ['./shopify-products.scss'],
})
export class ShopifyProductsPage extends ShopifyCursorTab<ShopifyProduct> {
    private marketplace = inject(ShopifyMarketplaceService);

    searchFilter = '';

    /** Varyantları açık olan ürünler */
    expanded = new Set<ShopifyProduct>();

    protected async fetchPage(page: number, size: number): Promise<PageResult<ShopifyProduct>> {
        this.expanded.clear();
        const data = this.unwrap(await this.marketplace.getProducts({
            search: this.searchFilter.trim() || null,
            limit: size,
            after: this.cursorFor(page),
        }));
        this.rememberCursor(page, data?.endCursor);
        return { items: this.extractArray(data?.items), hasNext: data?.hasNextPage === true };
    }

    protected searchText(product: ShopifyProduct): string {
        return [
            product.title, product.vendor, product.productType, ...(product.tags ?? []),
            ...this.variants(product).flatMap(v => [v.sku, v.barcode, v.title]),
        ].filter(Boolean).join(' ');
    }

    variants(product: ShopifyProduct): ShopifyProductVariant[] {
        return product.variants?.nodes ?? [];
    }

    levels(variant: ShopifyProductVariant): ShopifyInventoryLevel[] {
        return variant.inventoryItem?.inventoryLevels?.nodes ?? [];
    }

    /** Konumdaki satılabilir adet ("available") */
    availableAt(level: ShopifyInventoryLevel): number {
        const quantity = (level.quantities ?? []).find(q => q.name === 'available');
        return Number(quantity?.quantity) || 0;
    }

    price(value: string | null | undefined): number | null {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    priceRange(product: ShopifyProduct): string {
        const min = this.price(product.priceRangeV2?.minVariantPrice?.amount);
        const max = this.price(product.priceRangeV2?.maxVariantPrice?.amount);
        const currency = product.priceRangeV2?.minVariantPrice?.currencyCode || '';
        if (min === null && max === null) return '-';
        if (min !== null && max !== null && min !== max) {
            return `${min.toFixed(2)} – ${max.toFixed(2)} ${currency}`;
        }
        return `${(min ?? max ?? 0).toFixed(2)} ${currency}`;
    }

    stockClass(quantity: number | null | undefined): string {
        const value = Number(quantity) || 0;
        if (value <= 0) return 'bg-danger-subtle text-danger';
        if (value < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    statusLabel(status: string | null | undefined): string {
        return status ? STATUS_LABELS[status] || status : '-';
    }

    statusClass(status: string | null | undefined): string {
        switch (status) {
            case 'ACTIVE': return 'bg-success-subtle text-success';
            case 'ARCHIVED': return 'bg-danger-subtle text-danger';
            case 'DRAFT': return 'bg-warning-subtle text-warning';
            default: return 'bg-info-subtle text-info';
        }
    }

    toggle(product: ShopifyProduct): void {
        if (this.expanded.has(product)) this.expanded.delete(product);
        else this.expanded.add(product);
    }

    clearFilters(): void {
        this.searchFilter = '';
        this.onServerFilterChange();
    }
}

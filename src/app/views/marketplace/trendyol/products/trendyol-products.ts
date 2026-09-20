import { Component, inject } from '@angular/core';
import { TrendyolMarketplaceService } from '@/app/core/services/trendyol-marketplace.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { TrendyolProductInventory } from '@/app/core/models/marketplace/trendyol.models';

@Component({
    selector: 'app-trendyol-products',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './trendyol-products.html',
    styleUrls: ['./trendyol-products.scss'],
})
export class TrendyolProductsPage extends MarketplacePagedTab<TrendyolProductInventory> {
    private marketplace = inject(TrendyolMarketplaceService);

    barcodeFilter = '';
    stockCodeFilter = '';

    /** Varyantları açık olan ürünler */
    expanded = new Set<TrendyolProductInventory>();

    protected async fetchPage(page: number, size: number): Promise<PageResult<TrendyolProductInventory>> {
        this.expanded.clear();
        const data = this.unwrap(await this.marketplace.getProducts({
            barcode: this.barcodeFilter.trim() || null,
            stockCode: this.stockCodeFilter.trim() || null,
            page: page - 1,
            size,
        }));
        return {
            items: this.extractArray(data?.content),
            totalCount: Number(data?.totalElements) || 0,
            totalPages: data?.totalPages ?? null,
        };
    }

    protected searchText(p: TrendyolProductInventory): string {
        return [p.productMainId, ...(p.variants ?? []).flatMap(v => [v.barcode, v.stockCode])].filter(Boolean).join(' ');
    }

    toggle(p: TrendyolProductInventory): void {
        if (this.expanded.has(p)) this.expanded.delete(p);
        else this.expanded.add(p);
    }

    totalStock(p: TrendyolProductInventory): number {
        return (p.variants ?? []).reduce((sum, v) => sum + (Number(v.quantity) || 0), 0);
    }

    priceRange(p: TrendyolProductInventory): { min: number; max: number } | null {
        const prices = (p.variants ?? []).map(v => Number(v.salePrice)).filter(n => Number.isFinite(n));
        return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
    }

    stockClass(quantity: number | null | undefined): string {
        const q = Number(quantity) || 0;
        if (q <= 0) return 'bg-danger-subtle text-danger';
        if (q < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    clearFilters(): void {
        this.barcodeFilter = '';
        this.stockCodeFilter = '';
        this.onServerFilterChange();
    }
}

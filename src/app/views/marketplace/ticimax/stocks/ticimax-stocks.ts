import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicimaxMarketplaceService } from '@/app/core/services/ticimax-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import {
    TicimaxProductStockResponse,
    TicimaxVariantAttributeResponse,
} from '@/app/core/models/marketplace/ticimax.models';

@Component({
    selector: 'app-ticimax-stocks',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ticimax-stocks.html',
    styleUrls: ['./ticimax-stocks.scss'],
})
export class TicimaxStocksPage extends MarketplacePagedTab<TicimaxProductStockResponse> {
    private marketplace = inject(TicimaxMarketplaceService);

    barcodeFilter = '';
    productCodeFilter = '';

    /** Varyantları açık olan ürünler */
    expanded = new Set<TicimaxProductStockResponse>();

    protected async fetchPage(_page: number, _size: number): Promise<PageResult<TicimaxProductStockResponse>> {
        this.expanded.clear();
        const barcode = this.barcodeFilter.trim();
        const productCode = this.productCodeFilter.trim();
        const data = this.unwrap(await this.marketplace.getStocks({
            barcode: barcode || null,
            productCode: productCode || null,
            hasAnyFilter: !!(barcode || productCode),
        }));
        const items = this.extractArray(data);
        // Stok uç noktası sayfalama desteklemiyor: tek sayfa
        return { items, totalCount: items.length, totalPages: 1, hasNext: false };
    }

    protected searchText(p: TicimaxProductStockResponse): string {
        return [
            p.productName, p.brand,
            ...(p.variants ?? []).flatMap(v => [v.productCode, v.barcode, ...(v.attributes ?? []).map(a => a.value)]),
        ].filter(Boolean).join(' ');
    }

    toggle(p: TicimaxProductStockResponse): void {
        if (this.expanded.has(p)) this.expanded.delete(p);
        else this.expanded.add(p);
    }

    stockClass(quantity: number | null | undefined): string {
        const q = Number(quantity) || 0;
        if (q <= 0) return 'bg-danger-subtle text-danger';
        if (q < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    attributeText(attributes: TicimaxVariantAttributeResponse[] | null | undefined): string {
        return (attributes ?? []).map(a => `${a.name}: ${a.value}`).join(', ') || '-';
    }

    variantCount(p: TicimaxProductStockResponse): number {
        return (p.variants ?? []).length;
    }

    clearFilters(): void {
        this.barcodeFilter = '';
        this.productCodeFilter = '';
        this.onServerFilterChange();
    }
}

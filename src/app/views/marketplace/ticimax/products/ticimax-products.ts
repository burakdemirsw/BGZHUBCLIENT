import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicimaxMarketplaceService } from '@/app/core/services/ticimax-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import {
    TicimaxProductResponse,
    TicimaxVariantAttributeResponse,
} from '@/app/core/models/marketplace/ticimax.models';

@Component({
    selector: 'app-ticimax-products',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ticimax-products.html',
    styleUrls: ['./ticimax-products.scss'],
})
export class TicimaxProductsPage extends MarketplacePagedTab<TicimaxProductResponse> {
    private marketplace = inject(TicimaxMarketplaceService);

    productCodeFilter = '';
    barcodeFilter = '';
    /** '' = hepsi, 'true' = aktif, 'false' = pasif */
    activeFilter = '';

    /** Varyantları açık olan ürünler */
    expanded = new Set<TicimaxProductResponse>();

    protected async fetchPage(page: number, size: number): Promise<PageResult<TicimaxProductResponse>> {
        this.expanded.clear();
        const data = this.unwrap(await this.marketplace.getProducts({
            productCode: this.productCodeFilter.trim() || null,
            barcode: this.barcodeFilter.trim() || null,
            isActive: this.activeFilter === '' ? null : this.activeFilter === 'true',
            page,
            pageSize: size,
        }));
        const items = this.extractArray(data);
        // Uç nokta toplam kayıt bilgisi döndürmüyor
        return { items, hasNext: items.length === size };
    }

    protected searchText(p: TicimaxProductResponse): string {
        return [
            p.name, p.brand, p.mainCategory,
            ...(p.variants ?? []).flatMap(v => [v.stockCode, v.barcode, ...(v.attributes ?? []).map(a => a.value)]),
        ].filter(Boolean).join(' ');
    }

    toggle(p: TicimaxProductResponse): void {
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

    variantCount(p: TicimaxProductResponse): number {
        return (p.variants ?? []).length;
    }

    clearFilters(): void {
        this.productCodeFilter = '';
        this.barcodeFilter = '';
        this.activeFilter = '';
        this.onServerFilterChange();
    }
}

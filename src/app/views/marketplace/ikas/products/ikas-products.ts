import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IkasMarketplaceService } from '@/app/core/services/ikas-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { IkasProductDetailResponse, IkasVariantResponse } from '@/app/core/models/marketplace/ikas.models';

@Component({
    selector: 'app-ikas-products',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ikas-products.html',
    styleUrls: ['./ikas-products.scss'],
})
export class IkasProductsPage extends MarketplacePagedTab<IkasProductDetailResponse> {
    private marketplace = inject(IkasMarketplaceService);

    searchFilter = '';
    skuFilter = '';
    barcodeFilter = '';

    /** Varyantları açık olan ürünler */
    expanded = new Set<IkasProductDetailResponse>();

    protected async fetchPage(page: number, size: number): Promise<PageResult<IkasProductDetailResponse>> {
        this.expanded.clear();
        const data = this.unwrap(await this.marketplace.getProducts({
            search: this.searchFilter.trim() || null,
            sku: this.skuFilter.trim() || null,
            barcode: this.barcodeFilter.trim() || null,
            page,
            limit: size,
        }));
        const items = this.extractArray(data);
        // Uç nokta toplam kayıt döndürmüyor; sayfa dolu geldiyse sonraki sayfa var kabul edilir
        return { items, hasNext: items.length === size };
    }

    protected searchText(p: IkasProductDetailResponse): string {
        return [
            p.name, p.brand, p.type, ...(p.categories ?? []), ...(p.tags ?? []),
            ...(p.variants ?? []).flatMap(v => [v.sku, ...(v.barcodes ?? [])]),
        ].filter(Boolean).join(' ');
    }

    toggle(p: IkasProductDetailResponse): void {
        if (this.expanded.has(p)) this.expanded.delete(p);
        else this.expanded.add(p);
    }

    categoryText(p: IkasProductDetailResponse): string {
        return (p.categories ?? []).filter(Boolean).join(', ');
    }

    variantValueText(v: IkasVariantResponse): string {
        return (v.variantValues ?? []).map(vv => `${vv.name}: ${vv.value}`).join(' · ');
    }

    priceRange(p: IkasProductDetailResponse): { min: number; max: number } | null {
        const prices = (p.variants ?? []).map(v => Number(v.sellPrice)).filter(n => Number.isFinite(n));
        return prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
    }

    stockClass(quantity: number | null | undefined): string {
        const q = Number(quantity) || 0;
        if (q <= 0) return 'bg-danger-subtle text-danger';
        if (q < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    clearFilters(): void {
        this.searchFilter = '';
        this.skuFilter = '';
        this.barcodeFilter = '';
        this.onServerFilterChange();
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { ShopifyMarketplaceService } from '@/app/core/services/shopify-marketplace.service';
import { ShopifyLocationStockResponse, ShopifyStockResponse } from '@/app/core/models/marketplace/shopify.models';

/**
 * Stok uç noktası sayfalamaz; tek seferde gelen liste istemci tarafında filtrelenip sayfalanır.
 */
@Component({
    selector: 'app-shopify-stock',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './shopify-stock.html',
    styleUrls: ['./shopify-stock.scss'],
})
export class ShopifyStockPage extends MarketplacePagedTab<ShopifyStockResponse> {
    private marketplace = inject(ShopifyMarketplaceService);

    /** Uç noktanın tek istekte döndüreceği kayıt sayısı */
    private readonly fetchLimit = 100;

    barcodeFilter = '';
    productCodeFilter = '';

    showModal = false;
    selectedStock: ShopifyStockResponse | null = null;

    protected async fetchPage(): Promise<PageResult<ShopifyStockResponse>> {
        const barcode = this.barcodeFilter.trim();
        const productCode = this.productCodeFilter.trim();
        const data = this.unwrap(await this.marketplace.getStock({
            barcode: barcode || null,
            productCode: productCode || null,
            limit: this.fetchLimit,
            hasFilter: !!(barcode || productCode),
        }));
        const items = this.extractArray(data);
        return { items, totalCount: items.length, totalPages: 1 };
    }

    protected searchText(stock: ShopifyStockResponse): string {
        return [
            stock.productTitle, stock.variantTitle, stock.productCode, stock.barcode,
            ...(stock.locations ?? []).map(location => location.locationName),
        ].filter(Boolean).join(' ');
    }

    /** Sayfalama istemci tarafında yapılır: sayfa değişiminde yeniden istek atılmaz */
    override setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    override applyFilterAndPaging(): void {
        const term = this.filterText.trim().toLocaleLowerCase('tr');
        this.filteredItems = term
            ? this.items.filter(item => this.searchText(item).toLocaleLowerCase('tr').includes(term))
            : [...this.items];
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    override onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    price(value: string | null | undefined): number | null {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    stockClass(quantity: number | null | undefined): string {
        const value = Number(quantity) || 0;
        if (value <= 0) return 'bg-danger-subtle text-danger';
        if (value < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    locationSummary(stock: ShopifyStockResponse): string {
        const locations = stock.locations ?? [];
        const shown = locations.slice(0, 2).map(l => `${l.locationName}: ${l.available ?? 0}`).join(' · ');
        return locations.length > 2 ? `${shown} · +${locations.length - 2}` : (shown || '-');
    }

    locations(stock: ShopifyStockResponse): ShopifyLocationStockResponse[] {
        return stock.locations ?? [];
    }

    clearFilters(): void {
        this.barcodeFilter = '';
        this.productCodeFilter = '';
        this.filterText = '';
        this.onServerFilterChange();
    }

    openDetail(stock: ShopifyStockResponse): void {
        this.selectedStock = stock;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedStock = null;
    }
}

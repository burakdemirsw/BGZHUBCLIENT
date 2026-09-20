import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IkasMarketplaceService } from '@/app/core/services/ikas-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import {
    IkasStockLocationResponse,
    IkasStockResponse,
    IkasVariantStockResponse,
} from '@/app/core/models/marketplace/ikas.models';

@Component({
    selector: 'app-ikas-stocks',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ikas-stocks.html',
    styleUrls: ['./ikas-stocks.scss'],
})
export class IkasStocksPage extends MarketplacePagedTab<IkasVariantStockResponse> {
    private marketplace = inject(IkasMarketplaceService);

    /** Uç nokta sayfalama yapmaz; tek seferde sabit limit ile çekilir */
    private readonly fetchLimit = 200;

    codesFilter = '';
    stockLocationFilter = '';
    maxStockFilter: number | null = null;

    stockLocations: IkasStockLocationResponse[] = [];

    showModal = false;
    selectedStock: IkasVariantStockResponse | null = null;

    override async ngOnInit(): Promise<void> {
        await this.loadStockLocations();
        this.load();
    }

    private async loadStockLocations(): Promise<void> {
        try {
            const response = await this.marketplace.getStockLocations();
            this.stockLocations = Array.isArray(response.data) ? response.data : [];
        } catch (err) {
            console.error('Stok konumları yüklenemedi:', err);
            this.stockLocations = [];
        }
    }

    protected async fetchPage(): Promise<PageResult<IkasVariantStockResponse>> {
        const codes = this.codesFilter.split(',').map(c => c.trim()).filter(Boolean);
        const data = this.unwrap(await this.marketplace.getStocks({
            codes: codes.length ? codes : null,
            stockLocationId: this.stockLocationFilter || null,
            maxStockCount: this.maxStockFilter ?? null,
            limit: this.fetchLimit,
        }));
        // Uç nokta sayfalama yapmaz: tek sayfa
        return { items: this.extractArray(data), hasNext: false };
    }

    protected searchText(s: IkasVariantStockResponse): string {
        return [
            s.productName, s.variantName, s.sku, ...(s.barcodes ?? []),
            ...(s.stocks ?? []).map(l => l.stockLocationName),
        ].filter(Boolean).join(' ');
    }

    firstBarcode(s: IkasVariantStockResponse): string {
        return (s.barcodes ?? []).filter(Boolean)[0] || '-';
    }

    /** Konum kırılımında gösterilecek ilk iki kayıt */
    topLocations(s: IkasVariantStockResponse): IkasStockResponse[] {
        return (s.stocks ?? []).slice(0, 2);
    }

    remainingLocationCount(s: IkasVariantStockResponse): number {
        return Math.max(0, (s.stocks?.length || 0) - 2);
    }

    stockClass(quantity: number | null | undefined): string {
        const q = Number(quantity) || 0;
        if (q <= 0) return 'bg-danger-subtle text-danger';
        if (q < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    clearFilters(): void {
        this.codesFilter = '';
        this.stockLocationFilter = '';
        this.maxStockFilter = null;
        this.onServerFilterChange();
    }

    openDetail(stock: IkasVariantStockResponse): void {
        this.selectedStock = stock;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedStock = null;
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoynerMarketplaceService } from '@/app/core/services/boyner-marketplace.service';
import { TablePager } from '../../shared/table-pager/table-pager';
import { BoynerProductStockItem, BoynerProductStockResponse } from '@/app/core/models/marketplace/boyner.models';

/**
 * Tek bir ürünün stok kırılımını sorgular (uç nokta sayfalama yapmaz),
 * bu yüzden filtre ve sayfalama istemci tarafında uygulanır.
 */
@Component({
    selector: 'app-boyner-stock',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './boyner-stock.html',
    styleUrls: ['./boyner-stock.scss'],
})
export class BoynerStockPage {
    private marketplace = inject(BoynerMarketplaceService);

    barcodeInput = '';
    productCodeInput = '';

    loading = false;
    errorMessage = '';
    searched = false;
    result: BoynerProductStockResponse | null = null;

    items: BoynerProductStockItem[] = [];

    // Datatable
    filterText = '';
    filteredItems: BoynerProductStockItem[] = [];
    pagedItems: BoynerProductStockItem[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    showModal = false;
    selectedItem: BoynerProductStockItem | null = null;

    async search(): Promise<void> {
        const barcode = this.barcodeInput.trim();
        const productCode = this.productCodeInput.trim();
        if (!barcode && !productCode) {
            this.errorMessage = 'Lütfen barkod veya ürün kodu girin.';
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        try {
            const response = await this.marketplace.getProductStock({
                barcode: barcode || null,
                productCode: productCode || null,
            });
            if (!response.isSuccess) {
                this.errorMessage = response.innerError || response.errorCode || 'Stok bilgisi alınamadı.';
            }
            this.result = response.data ?? null;
            this.items = this.extractArray(this.result?.items);
        } catch (err) {
            console.error('Stok sorgusu başarısız:', err);
            const body = (err as { error?: { innerError?: string; errorCode?: string } })?.error;
            this.errorMessage = body?.innerError || body?.errorCode || 'Stok bilgisi alınamadı.';
            this.result = null;
            this.items = [];
        } finally {
            this.searched = true;
            this.currentPage = 1;
            this.applyFilterAndPaging();
            this.loading = false;
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const term = this.filterText.trim().toLocaleLowerCase('tr');
        this.filteredItems = term
            ? this.items.filter(i => [i.barcode, i.stockCode, i.productMainId, i.title, i.color, i.size]
                .filter(Boolean).join(' ').toLocaleLowerCase('tr').includes(term))
            : [...this.items];
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    clearFilters(): void {
        this.barcodeInput = '';
        this.productCodeInput = '';
        this.filterText = '';
        this.errorMessage = '';
        this.searched = false;
        this.result = null;
        this.items = [];
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    stockClass(quantity: number | null | undefined): string {
        const q = Number(quantity) || 0;
        if (q <= 0) return 'bg-danger-subtle text-danger';
        if (q < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    openDetail(item: BoynerProductStockItem): void {
        this.selectedItem = item;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedItem = null;
    }

    private extractArray(response: unknown): BoynerProductStockItem[] {
        const source = response as {
            $values?: BoynerProductStockItem[];
            data?: BoynerProductStockItem[] | BoynerProductStockItem;
            items?: BoynerProductStockItem[];
            result?: BoynerProductStockItem[] | BoynerProductStockItem;
        } | null | undefined;
        if (Array.isArray(response)) return response as BoynerProductStockItem[];
        if (source?.$values) return source.$values;
        if (source?.data) return Array.isArray(source.data) ? source.data : [source.data];
        if (source?.items) return source.items;
        if (source?.result) return Array.isArray(source.result) ? source.result : [source.result];
        return [];
    }
}

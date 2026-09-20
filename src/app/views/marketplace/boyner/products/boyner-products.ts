import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoynerMarketplaceService } from '@/app/core/services/boyner-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { BoynerProduct } from '@/app/core/models/marketplace/boyner.models';

@Component({
    selector: 'app-boyner-products',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './boyner-products.html',
    styleUrls: ['./boyner-products.scss'],
})
export class BoynerProductsPage extends MarketplacePagedTab<BoynerProduct> {
    private marketplace = inject(BoynerMarketplaceService);

    barcodeFilter = '';
    stockCodeFilter = '';
    productMainIdFilter = '';
    /** '' = hepsi, 'true' / 'false' */
    onSaleFilter = '';
    approvedFilter = '';

    showModal = false;
    selectedProduct: BoynerProduct | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<BoynerProduct>> {
        const data = this.unwrap(await this.marketplace.getProducts({
            barcode: this.barcodeFilter.trim() || null,
            stockCode: this.stockCodeFilter.trim() || null,
            productMainId: this.productMainIdFilter.trim() || null,
            isOnSale: this.toBool(this.onSaleFilter),
            isApproved: this.toBool(this.approvedFilter),
            page: page - 1,
            size,
        }));
        return {
            items: this.extractArray(data?.content),
            totalCount: Number(data?.totalElements) || 0,
            totalPages: data?.totalPages ?? null,
        };
    }

    protected searchText(p: BoynerProduct): string {
        return [p.title, p.brand, p.categoryName, p.barcode, p.stockCode, p.productMainId, p.color, p.size]
            .filter(Boolean).join(' ');
    }

    private toBool(value: string): boolean | null {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return null;
    }

    firstImage(p: BoynerProduct): string | null {
        return (p.images ?? []).find(i => !!i.url)?.url ?? null;
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
        this.productMainIdFilter = '';
        this.onSaleFilter = '';
        this.approvedFilter = '';
        this.onServerFilterChange();
    }

    openDetail(product: BoynerProduct): void {
        this.selectedProduct = product;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedProduct = null;
    }
}

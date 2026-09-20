import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HepsiburadaMarketplaceService } from '@/app/core/services/hepsiburada-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { HepsiburadaCatalogProduct } from '@/app/core/models/marketplace/hepsiburada.models';

@Component({
    selector: 'app-hepsiburada-products',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './hepsiburada-products.html',
    styleUrls: ['./hepsiburada-products.scss'],
})
export class HepsiburadaProductsPage extends MarketplacePagedTab<HepsiburadaCatalogProduct> {
    private marketplace = inject(HepsiburadaMarketplaceService);

    barcodeFilter = '';
    merchantSkuFilter = '';

    showModal = false;
    selectedProduct: HepsiburadaCatalogProduct | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<HepsiburadaCatalogProduct>> {
        const data = this.unwrap(await this.marketplace.getProducts({
            barcode: this.barcodeFilter.trim() || null,
            merchantSku: this.merchantSkuFilter.trim() || null,
            page: page - 1,
            size,
        }));
        return {
            items: this.extractArray(data?.data),
            totalCount: Number(data?.totalElements) || 0,
            totalPages: data?.totalPages ?? null,
        };
    }

    protected searchText(p: HepsiburadaCatalogProduct): string {
        return [p.productName, p.brand, p.categoryName, p.barcode, p.merchantSku, p.status].filter(Boolean).join(' ');
    }

    statusClass(status: string | null | undefined): string {
        switch ((status || '').toLocaleLowerCase('en')) {
            case 'active':
            case 'approved':
                return 'bg-success-subtle text-success';
            case 'waiting':
            case 'pending':
                return 'bg-warning-subtle text-warning';
            case 'rejected':
            case 'passive':
                return 'bg-danger-subtle text-danger';
            default:
                return 'bg-primary-subtle text-primary';
        }
    }

    clearFilters(): void {
        this.barcodeFilter = '';
        this.merchantSkuFilter = '';
        this.filterText = '';
        this.onServerFilterChange();
    }

    openDetail(product: HepsiburadaCatalogProduct): void {
        this.selectedProduct = product;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedProduct = null;
    }
}

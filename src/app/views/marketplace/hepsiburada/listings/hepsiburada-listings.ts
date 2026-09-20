import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HepsiburadaMarketplaceService } from '@/app/core/services/hepsiburada-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { HepsiburadaListing } from '@/app/core/models/marketplace/hepsiburada.models';

@Component({
    selector: 'app-hepsiburada-listings',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './hepsiburada-listings.html',
    styleUrls: ['./hepsiburada-listings.scss'],
})
export class HepsiburadaListingsPage extends MarketplacePagedTab<HepsiburadaListing> {
    private marketplace = inject(HepsiburadaMarketplaceService);

    /** Virgülle ayrılmış satıcı stok kodları */
    merchantSkuFilter = '';

    showModal = false;
    selectedListing: HepsiburadaListing | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<HepsiburadaListing>> {
        const merchantSkus = this.merchantSkuFilter
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        const data = this.unwrap(await this.marketplace.getListings({
            merchantSkus: merchantSkus.length ? merchantSkus : null,
            offset: (page - 1) * size,
            limit: size,
        }));
        return {
            items: this.extractArray(data?.listings),
            totalCount: Number(data?.totalCount) || 0,
        };
    }

    protected searchText(l: HepsiburadaListing): string {
        return [l.merchantSku, String(l.price ?? ''), String(l.availableStock ?? '')].filter(Boolean).join(' ');
    }

    stockClass(quantity: number | null | undefined): string {
        const q = Number(quantity) || 0;
        if (q <= 0) return 'bg-danger-subtle text-danger';
        if (q < 5) return 'bg-warning-subtle text-warning';
        return 'bg-success-subtle text-success';
    }

    clearFilters(): void {
        this.merchantSkuFilter = '';
        this.filterText = '';
        this.onServerFilterChange();
    }

    openDetail(listing: HepsiburadaListing): void {
        this.selectedListing = listing;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedListing = null;
    }
}

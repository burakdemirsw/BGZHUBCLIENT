import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BoynerOrdersPage } from './orders/boyner-orders';
import { BoynerProductsPage } from './products/boyner-products';
import { BoynerStockPage } from './stock/boyner-stock';
import { MarketplaceCustomersPage } from '../shared/customers/marketplace-customers';
import { BoynerMarketplaceService } from '@/app/core/services/boyner-marketplace.service';
import { MarketplaceCustomerQuery } from '@/app/core/models/marketplace/marketplace.models';

type BoynerTab = 'orders' | 'products' | 'stock' | 'customers';

@Component({
    selector: 'app-boyner-page',
    imports: [BoynerOrdersPage, BoynerProductsPage, BoynerStockPage, MarketplaceCustomersPage],
    templateUrl: './boyner.html',
    styleUrls: ['./boyner.scss'],
})
export class BoynerPage implements OnInit {
    private marketplace = inject(BoynerMarketplaceService);

    readonly tabs: { key: BoynerTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-box' },
        { key: 'products', label: 'Ürünlerim', icon: 'fa-solid fa-tags' },
        { key: 'stock', label: 'Stok Sorgu', icon: 'fa-solid fa-boxes-stacked' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: BoynerTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<BoynerTab>();

    readonly loadCustomers = (query: MarketplaceCustomerQuery) => this.marketplace.getCustomers(query);

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as BoynerTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: BoynerTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShopifyOrdersPage } from './orders/shopify-orders';
import { ShopifyProductsPage } from './products/shopify-products';
import { ShopifyStockPage } from './stock/shopify-stock';
import { ShopifyCustomersPage } from './customers/shopify-customers';

type ShopifyTab = 'orders' | 'products' | 'stock' | 'customers';

@Component({
    selector: 'app-shopify-page',
    imports: [ShopifyOrdersPage, ShopifyProductsPage, ShopifyStockPage, ShopifyCustomersPage],
    templateUrl: './shopify.html',
    styleUrls: ['./shopify.scss'],
})
export class ShopifyPage implements OnInit {
    readonly tabs: { key: ShopifyTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-bag-shopping' },
        { key: 'products', label: 'Ürünlerim', icon: 'fa-solid fa-tags' },
        { key: 'stock', label: 'Stoklarım', icon: 'fa-solid fa-warehouse' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: ShopifyTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<ShopifyTab>();

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as ShopifyTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: ShopifyTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

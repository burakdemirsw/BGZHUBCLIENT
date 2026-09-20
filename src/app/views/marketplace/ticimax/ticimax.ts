import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TicimaxOrdersPage } from './orders/ticimax-orders';
import { TicimaxProductsPage } from './products/ticimax-products';
import { TicimaxStocksPage } from './stocks/ticimax-stocks';
import { TicimaxCustomersPage } from './customers/ticimax-customers';

type TicimaxTab = 'orders' | 'products' | 'stocks' | 'customers';

@Component({
    selector: 'app-ticimax-page',
    imports: [TicimaxOrdersPage, TicimaxProductsPage, TicimaxStocksPage, TicimaxCustomersPage],
    templateUrl: './ticimax.html',
    styleUrls: ['./ticimax.scss'],
})
export class TicimaxPage implements OnInit {
    readonly tabs: { key: TicimaxTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-box' },
        { key: 'products', label: 'Ürünlerim', icon: 'fa-solid fa-tags' },
        { key: 'stocks', label: 'Stoklarım', icon: 'fa-solid fa-warehouse' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: TicimaxTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<TicimaxTab>();

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as TicimaxTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: TicimaxTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

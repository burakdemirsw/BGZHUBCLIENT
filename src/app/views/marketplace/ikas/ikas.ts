import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IkasOrdersPage } from './orders/ikas-orders';
import { IkasProductsPage } from './products/ikas-products';
import { IkasStocksPage } from './stocks/ikas-stocks';
import { IkasCustomersPage } from './customers/ikas-customers';

type IkasTab = 'orders' | 'products' | 'stocks' | 'customers';

@Component({
    selector: 'app-ikas-page',
    imports: [IkasOrdersPage, IkasProductsPage, IkasStocksPage, IkasCustomersPage],
    templateUrl: './ikas.html',
    styleUrls: ['./ikas.scss'],
})
export class IkasPage implements OnInit {
    readonly tabs: { key: IkasTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-box' },
        { key: 'products', label: 'Ürünlerim', icon: 'fa-solid fa-tags' },
        { key: 'stocks', label: 'Stoklarım', icon: 'fa-solid fa-warehouse' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: IkasTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<IkasTab>();

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as IkasTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: IkasTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TrendyolOrdersPage } from './orders/trendyol-orders';
import { TrendyolProductsPage } from './products/trendyol-products';
import { TrendyolClaimsPage } from './claims/trendyol-claims';
import { TrendyolQuestionsPage } from './questions/trendyol-questions';
import { MarketplaceCustomersPage } from '../shared/customers/marketplace-customers';
import { TrendyolMarketplaceService } from '@/app/core/services/trendyol-marketplace.service';
import { MarketplaceCustomerQuery } from '@/app/core/models/marketplace/marketplace.models';

type TrendyolTab = 'orders' | 'products' | 'claims' | 'questions' | 'customers';

@Component({
    selector: 'app-trendyol-page',
    imports: [TrendyolOrdersPage, TrendyolProductsPage, TrendyolClaimsPage, TrendyolQuestionsPage, MarketplaceCustomersPage],
    templateUrl: './trendyol.html',
    styleUrls: ['./trendyol.scss'],
})
export class TrendyolPage implements OnInit {
    private marketplace = inject(TrendyolMarketplaceService);

    readonly tabs: { key: TrendyolTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-box' },
        { key: 'products', label: 'Ürünlerim', icon: 'fa-solid fa-tags' },
        { key: 'claims', label: 'İadelerim', icon: 'fa-solid fa-rotate-left' },
        { key: 'questions', label: 'Sorularım', icon: 'fa-regular fa-circle-question' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: TrendyolTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<TrendyolTab>();

    readonly loadCustomers = (query: MarketplaceCustomerQuery) => this.marketplace.getCustomers(query);

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as TrendyolTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: TrendyolTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

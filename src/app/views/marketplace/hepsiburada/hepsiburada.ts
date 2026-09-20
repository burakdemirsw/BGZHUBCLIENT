import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HepsiburadaOrdersPage } from './orders/hepsiburada-orders';
import { HepsiburadaProductsPage } from './products/hepsiburada-products';
import { HepsiburadaListingsPage } from './listings/hepsiburada-listings';
import { HepsiburadaQuestionsPage } from './questions/hepsiburada-questions';
import { MarketplaceCustomersPage } from '../shared/customers/marketplace-customers';
import { HepsiburadaMarketplaceService } from '@/app/core/services/hepsiburada-marketplace.service';
import { MarketplaceCustomerQuery } from '@/app/core/models/marketplace/marketplace.models';

type HepsiburadaTab = 'orders' | 'products' | 'listings' | 'questions' | 'customers';

@Component({
    selector: 'app-hepsiburada-page',
    imports: [HepsiburadaOrdersPage, HepsiburadaProductsPage, HepsiburadaListingsPage, HepsiburadaQuestionsPage, MarketplaceCustomersPage],
    templateUrl: './hepsiburada.html',
    styleUrls: ['./hepsiburada.scss'],
})
export class HepsiburadaPage implements OnInit {
    private marketplace = inject(HepsiburadaMarketplaceService);

    readonly tabs: { key: HepsiburadaTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-box' },
        { key: 'products', label: 'Ürünlerim', icon: 'fa-solid fa-tags' },
        { key: 'listings', label: 'İlanlarım', icon: 'fa-solid fa-store' },
        { key: 'questions', label: 'Sorularım', icon: 'fa-regular fa-circle-question' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: HepsiburadaTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<HepsiburadaTab>();

    readonly loadCustomers = (query: MarketplaceCustomerQuery) => this.marketplace.getCustomers(query);

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as HepsiburadaTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: HepsiburadaTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

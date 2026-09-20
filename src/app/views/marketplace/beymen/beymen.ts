import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BeymenOrdersPage } from './orders/beymen-orders';
import { BeymenQuestionsPage } from './questions/beymen-questions';
import { MarketplaceCustomersPage } from '../shared/customers/marketplace-customers';
import { BeymenMarketplaceService } from '@/app/core/services/beymen-marketplace.service';
import { MarketplaceCustomerQuery } from '@/app/core/models/marketplace/marketplace.models';

type BeymenTab = 'orders' | 'questions' | 'customers';

@Component({
    selector: 'app-beymen-page',
    imports: [BeymenOrdersPage, BeymenQuestionsPage, MarketplaceCustomersPage],
    templateUrl: './beymen.html',
    styleUrls: ['./beymen.scss'],
})
export class BeymenPage implements OnInit {
    private marketplace = inject(BeymenMarketplaceService);

    readonly tabs: { key: BeymenTab; label: string; icon: string }[] = [
        { key: 'orders', label: 'Siparişlerim', icon: 'fa-solid fa-box' },
        { key: 'questions', label: 'Sorularım', icon: 'fa-regular fa-circle-question' },
        { key: 'customers', label: 'Müşterilerim', icon: 'fa-solid fa-users' },
    ];

    activeTab: BeymenTab = 'orders';
    /** Bir kez açılan sekmeler DOM'da tutulur; tekrar geçişte veri yeniden çekilmez */
    visited = new Set<BeymenTab>();

    readonly loadCustomers = (query: MarketplaceCustomerQuery) => this.marketplace.getCustomers(query);

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit(): void {
        const tab = this.route.snapshot.queryParamMap.get('tab') as BeymenTab | null;
        this.selectTab(tab && this.tabs.some(t => t.key === tab) ? tab : 'orders', false);
    }

    selectTab(tab: BeymenTab, syncUrl = true): void {
        this.activeTab = tab;
        this.visited.add(tab);
        if (syncUrl) {
            this.router.navigate([], { relativeTo: this.route, queryParams: { tab }, replaceUrl: true });
        }
    }
}

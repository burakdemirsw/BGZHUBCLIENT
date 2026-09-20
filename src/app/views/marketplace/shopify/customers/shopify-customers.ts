import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopifyCursorTab } from '../shopify-cursor-tab';
import { PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { ShopifyMarketplaceService } from '@/app/core/services/shopify-marketplace.service';
import { ShopifyCustomerDetail } from '@/app/core/models/marketplace/shopify.models';

@Component({
    selector: 'app-shopify-customers',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './shopify-customers.html',
    styleUrls: ['./shopify-customers.scss'],
})
export class ShopifyCustomersPage extends ShopifyCursorTab<ShopifyCustomerDetail> {
    private marketplace = inject(ShopifyMarketplaceService);

    searchFilter = '';
    emailFilter = '';
    phoneFilter = '';

    showModal = false;
    selectedCustomer: ShopifyCustomerDetail | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<ShopifyCustomerDetail>> {
        const data = this.unwrap(await this.marketplace.getCustomers({
            search: this.searchFilter.trim() || null,
            email: this.emailFilter.trim() || null,
            phone: this.phoneFilter.trim() || null,
            limit: size,
            after: this.cursorFor(page),
        }));
        this.rememberCursor(page, data?.endCursor);
        return { items: this.extractArray(data?.customers), hasNext: data?.hasNextPage === true };
    }

    protected searchText(customer: ShopifyCustomerDetail): string {
        return [
            customer.displayName, customer.firstName, customer.lastName,
            this.email(customer), this.phone(customer), ...(customer.tags ?? []),
        ].filter(Boolean).join(' ');
    }

    email(customer: ShopifyCustomerDetail): string {
        return customer.defaultEmailAddress?.emailAddress || '';
    }

    phone(customer: ShopifyCustomerDetail): string {
        return customer.defaultPhoneNumber?.phoneNumber || '';
    }

    /** numberOfOrders string döner */
    orderCount(customer: ShopifyCustomerDetail): number {
        return Number(customer.numberOfOrders) || 0;
    }

    spent(customer: ShopifyCustomerDetail): number | null {
        const value = Number(customer.amountSpent?.amount);
        return Number.isFinite(value) ? value : null;
    }

    clearFilters(): void {
        this.searchFilter = '';
        this.emailFilter = '';
        this.phoneFilter = '';
        this.onServerFilterChange();
    }

    openDetail(customer: ShopifyCustomerDetail): void {
        this.selectedCustomer = customer;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedCustomer = null;
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicimaxMarketplaceService } from '@/app/core/services/ticimax-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { TicimaxCustomerResponse } from '@/app/core/models/marketplace/ticimax.models';

@Component({
    selector: 'app-ticimax-customers',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ticimax-customers.html',
    styleUrls: ['./ticimax-customers.scss'],
})
export class TicimaxCustomersPage extends MarketplacePagedTab<TicimaxCustomerResponse> {
    private marketplace = inject(TicimaxMarketplaceService);

    emailFilter = '';
    phoneFilter = '';
    customerCodeFilter = '';

    showModal = false;
    selectedCustomer: TicimaxCustomerResponse | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<TicimaxCustomerResponse>> {
        const data = this.unwrap(await this.marketplace.getCustomers({
            email: this.emailFilter.trim() || null,
            phone: this.phoneFilter.trim() || null,
            customerCode: this.customerCodeFilter.trim() || null,
            includeAddresses: true,
            page,
            pageSize: size,
        }));
        const items = this.extractArray(data);
        // Uç nokta toplam kayıt bilgisi döndürmüyor
        return { items, hasNext: items.length === size };
    }

    protected searchText(c: TicimaxCustomerResponse): string {
        return [
            c.firstName, c.lastName, c.email, c.phone, c.mobilePhone,
            c.city, c.district, c.membershipType, c.memberType,
        ].filter(Boolean).join(' ');
    }

    fullName(c: TicimaxCustomerResponse): string {
        return [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || '-';
    }

    membership(c: TicimaxCustomerResponse): string {
        return c.membershipType || c.memberType || '-';
    }

    contactPhone(c: TicimaxCustomerResponse): string {
        return c.mobilePhone || c.phone || '-';
    }

    clearFilters(): void {
        this.emailFilter = '';
        this.phoneFilter = '';
        this.customerCodeFilter = '';
        this.onServerFilterChange();
    }

    openDetail(customer: TicimaxCustomerResponse): void {
        this.selectedCustomer = customer;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedCustomer = null;
    }
}

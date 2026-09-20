import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IkasMarketplaceService } from '@/app/core/services/ikas-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { IkasCustomer, IkasCustomerAddress } from '@/app/core/models/marketplace/ikas.models';

@Component({
    selector: 'app-ikas-customers',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ikas-customers.html',
    styleUrls: ['./ikas-customers.scss'],
})
export class IkasCustomersPage extends MarketplacePagedTab<IkasCustomer> {
    private marketplace = inject(IkasMarketplaceService);

    searchFilter = '';
    emailFilter = '';
    phoneFilter = '';

    showModal = false;
    selectedCustomer: IkasCustomer | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<IkasCustomer>> {
        const data = this.unwrap(await this.marketplace.getCustomers({
            search: this.searchFilter.trim() || null,
            email: this.emailFilter.trim() || null,
            phone: this.phoneFilter.trim() || null,
            page,
            limit: size,
        }));
        return {
            items: this.extractArray(data?.customers),
            totalCount: Number(data?.totalCount) || 0,
            hasNext: data?.hasNext ?? false,
        };
    }

    protected searchText(c: IkasCustomer): string {
        return [this.fullName(c), c.email, c.phone, c.note, c.accountStatus].filter(Boolean).join(' ');
    }

    fullName(c: IkasCustomer): string {
        return [c.firstName, c.lastName].filter(Boolean).join(' ').trim();
    }

    addressLocation(a: IkasCustomerAddress): string {
        return [a.district?.name, a.city?.name].filter(Boolean).join(' / ');
    }

    clearFilters(): void {
        this.searchFilter = '';
        this.emailFilter = '';
        this.phoneFilter = '';
        this.onServerFilterChange();
    }

    openDetail(customer: IkasCustomer): void {
        this.selectedCustomer = customer;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedCustomer = null;
    }
}

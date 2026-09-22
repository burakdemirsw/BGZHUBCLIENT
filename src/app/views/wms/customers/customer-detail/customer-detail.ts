import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WmsDetailPage } from '@/app/views/wms/shared/wms-detail-page';
import { WmsOrderSummaryTable } from '@/app/views/wms/shared/order-summary-table/order-summary-table';
import { WmsCustomersService } from '@/app/core/services/wms/wms-customers.service';
import {
    WmsCustomerAddressDetail,
    WmsCustomerDetailResponse,
} from '@/app/core/models/wms/customer-view.models';

type CustomerTab = 'addresses' | 'communications' | 'attributes' | 'orders';

@Component({
    selector: 'app-wms-customer-detail-page',
    imports: [CommonModule, RouterLink, WmsOrderSummaryTable],
    templateUrl: './customer-detail.html',
    styleUrls: ['./customer-detail.scss'],
})
export class WmsCustomerDetailPage extends WmsDetailPage<WmsCustomerDetailResponse, CustomerTab> {
    private readonly customersService = inject(WmsCustomersService);

    activeTab: CustomerTab = 'orders';

    protected fetchDetail(id: string): Promise<WmsCustomerDetailResponse | null> {
        return this.customersService.getDetails(id);
    }

    recipientName(address: WmsCustomerAddressDetail): string {
        return (
            [address.recipientFirstName, address.recipientLastName].filter(Boolean).join(' ') ||
            address.recipientCompanyName ||
            '—'
        );
    }

    addressLocation(address: WmsCustomerAddressDetail): string {
        return [
            address.quarterName,
            address.districtDescription || address.districtCode,
            address.cityDescription || address.cityCode,
            address.countryDescription || address.countryCode,
            address.zipCode,
        ]
            .filter(Boolean)
            .join(', ');
    }
}

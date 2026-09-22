import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WmsDetailPage } from '@/app/views/wms/shared/wms-detail-page';
import { WmsOrdersService } from '@/app/core/services/wms/wms-orders.service';
import {
    WmsOrderAddressDetail,
    WmsOrderDetailResponse,
    WmsOrderLineDetail,
} from '@/app/core/models/wms/order-view.models';

type OrderTab = 'lines' | 'payments' | 'cargos' | 'invoices' | 'claims';

@Component({
    selector: 'app-wms-order-detail-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './order-detail.html',
    styleUrls: ['./order-detail.scss'],
})
export class WmsOrderDetailPage extends WmsDetailPage<WmsOrderDetailResponse, OrderTab> {
    private readonly ordersService = inject(WmsOrdersService);

    activeTab: OrderTab = 'lines';

    protected fetchDetail(id: string): Promise<WmsOrderDetailResponse | null> {
        return this.ordersService.getDetails(id);
    }

    /**
     * Satırın belge para birimindeki net tutarı. Satır birden çok para biriminde
     * döküm taşıyabildiği için belge birimine ait olan seçilir.
     */
    lineNetAmount(line: WmsOrderLineDetail): number | null {
        const amount =
            line.amounts.find(a => a.currencyCode === line.doc_CurrencyCode) ?? line.amounts[0];
        return amount?.netAmount ?? null;
    }

    lineVariant(line: WmsOrderLineDetail): string {
        return [
            line.colorDescription || line.colorCode,
            line.itemDim1Description || line.itemDim1Code,
        ]
            .filter(Boolean)
            .join(' / ');
    }

    recipientName(address: WmsOrderAddressDetail): string {
        return (
            address.firstLastName ||
            [address.firstName, address.lastName].filter(Boolean).join(' ') ||
            address.companyName ||
            '—'
        );
    }

    addressLocation(address: WmsOrderAddressDetail): string {
        return [
            address.quarterName,
            address.districtDescription || address.districtCode,
            address.cityDescription || address.cityCode,
            address.zipCode,
        ]
            .filter(Boolean)
            .join(', ');
    }
}

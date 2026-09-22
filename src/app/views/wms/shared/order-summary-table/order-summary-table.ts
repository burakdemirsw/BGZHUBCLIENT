import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WmsOrderListItem } from '@/app/core/models/wms/order-view.models';

/**
 * Müşteri ve ürün detaylarında gösterilen "son siparişler" tablosu.
 * Her satır sipariş detayına bağlanır.
 */
@Component({
    selector: 'app-wms-order-summary-table',
    imports: [CommonModule, RouterLink],
    templateUrl: './order-summary-table.html',
})
export class WmsOrderSummaryTable {
    @Input() orders: WmsOrderListItem[] = [];

    /** Müşteri detayında müşteri kolonu tekrar gösterilmez */
    @Input() showCustomer = true;
}

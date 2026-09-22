import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsListPage } from '@/app/views/wms/shared/wms-list-page';
import { WmsOrdersService } from '@/app/core/services/wms/wms-orders.service';
import { WmsOrderListItem } from '@/app/core/models/wms/order-view.models';

/** İptal filtresi: tümü / yalnız aktif siparişler / yalnız iptaller */
type CancelFilter = 'all' | 'active' | 'cancelled';

@Component({
    selector: 'app-wms-orders-page',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './orders.html',
    styleUrls: ['./orders.scss'],
})
export class WmsOrdersPage extends WmsListPage<WmsOrderListItem> {
    private readonly ordersService = inject(WmsOrdersService);

    startDate = '';
    endDate = '';
    cancelFilter: CancelFilter = 'all';

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<WmsOrderListItem>> {
        return this.ordersService.getList({
            ...request,
            startDate: this.startDate || null,
            endDate: this.endDate || null,
            isCancelOrder: this.cancelFilter === 'all' ? null : this.cancelFilter === 'cancelled',
        });
    }

    get hasActiveFilters(): boolean {
        return !!(this.filterText || this.startDate || this.endDate || this.cancelFilter !== 'all');
    }

    clearFilters(): void {
        this.filterText = '';
        this.startDate = '';
        this.endDate = '';
        this.cancelFilter = 'all';
        this.applyFilters();
    }

    shippingLocation(order: WmsOrderListItem): string {
        return [order.shippingDistrictDescription, order.shippingCityDescription].filter(Boolean).join(' / ');
    }
}

import { Injectable } from '@angular/core';
import { WmsResourceService } from './wms-crud.service';
import { PagedResult } from '../../models/pagination.model';
import {
    WmsOrderDetailResponse,
    WmsOrderListItem,
    WmsOrderListRequest,
} from '../../models/wms/order-view.models';

/** /api/wms/orders — sipariş liste ve detay görünümleri */
@Injectable({ providedIn: 'root' })
export class WmsOrdersService extends WmsResourceService {
    protected readonly resource = 'orders';

    getList(request: Partial<WmsOrderListRequest>): Promise<PagedResult<WmsOrderListItem>> {
        return this.postListView<WmsOrderListItem>(request);
    }

    getDetails(id: string): Promise<WmsOrderDetailResponse | null> {
        return this.getDetailView<WmsOrderDetailResponse>(id);
    }
}

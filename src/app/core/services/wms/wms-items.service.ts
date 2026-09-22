import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import { PagedResult } from '../../models/pagination.model';
import {
    CreateItemRequest,
    ItemResponse,
    UpdateItemRequest,
} from '../../models/wms/item.models';
import {
    WmsItemDetailResponse,
    WmsItemListItem,
    WmsItemListRequest,
} from '../../models/wms/item-view.models';

/** /api/wms/items — ürün kartı CRUD'u ile liste ve detay görünümleri */
@Injectable({ providedIn: 'root' })
export class WmsItemsService extends WmsCompanyCrudService<
    ItemResponse,
    Omit<CreateItemRequest, 'companyId'>,
    UpdateItemRequest
> {
    protected readonly resource = 'items';

    getList(request: Partial<WmsItemListRequest>): Promise<PagedResult<WmsItemListItem>> {
        return this.postListView<WmsItemListItem>(request);
    }

    getDetails(id: string): Promise<WmsItemDetailResponse | null> {
        return this.getDetailView<WmsItemDetailResponse>(id);
    }
}

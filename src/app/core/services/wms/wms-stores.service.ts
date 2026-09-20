import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateStoreRequest,
    StoreResponse,
    UpdateStoreRequest
} from '../../models/wms/store.models';

/** /api/wms/stores */
@Injectable({ providedIn: 'root' })
export class WmsStoresService extends WmsCompanyCrudService<
    StoreResponse,
    Omit<CreateStoreRequest, 'companyId'>,
    UpdateStoreRequest
> {
    protected readonly resource = 'stores';
}

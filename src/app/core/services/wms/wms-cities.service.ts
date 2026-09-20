import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateWmsCityRequest,
    UpdateWmsCityRequest,
    WmsCityResponse,
} from '../../models/wms/location.models';

/** /api/wms/city — şirketten bağımsız lokasyon kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsCitiesService extends WmsGlobalCrudService<
    WmsCityResponse,
    CreateWmsCityRequest,
    UpdateWmsCityRequest
> {
    protected readonly resource = 'city';
}

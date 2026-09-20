import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateWmsDistrictRequest,
    UpdateWmsDistrictRequest,
    WmsDistrictResponse,
} from '../../models/wms/location.models';

/** /api/wms/district — şirketten bağımsız lokasyon kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsDistrictsService extends WmsGlobalCrudService<
    WmsDistrictResponse,
    CreateWmsDistrictRequest,
    UpdateWmsDistrictRequest
> {
    protected readonly resource = 'district';
}

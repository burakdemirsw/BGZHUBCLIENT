import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateWmsStateRequest,
    UpdateWmsStateRequest,
    WmsStateResponse,
} from '../../models/wms/location.models';

/** /api/wms/state — şirketten bağımsız lokasyon kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsStatesService extends WmsGlobalCrudService<
    WmsStateResponse,
    CreateWmsStateRequest,
    UpdateWmsStateRequest
> {
    protected readonly resource = 'state';
}

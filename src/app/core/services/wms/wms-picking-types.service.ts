import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreatePickingTypeRequest,
    PickingTypeResponse,
    UpdatePickingTypeRequest
} from '../../models/wms/picking-type.models';

/** /api/wms/picking-types - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsPickingTypesService extends WmsGlobalCrudService<
    PickingTypeResponse,
    CreatePickingTypeRequest,
    UpdatePickingTypeRequest
> {
    protected readonly resource = 'picking-types';
}

import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateItemTypeRequest,
    ItemTypeResponse,
    UpdateItemTypeRequest
} from '../../models/wms/item-type.models';

/** /api/wms/item-types - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsItemTypesService extends WmsGlobalCrudService<
    ItemTypeResponse,
    CreateItemTypeRequest,
    UpdateItemTypeRequest
> {
    protected readonly resource = 'item-types';
}

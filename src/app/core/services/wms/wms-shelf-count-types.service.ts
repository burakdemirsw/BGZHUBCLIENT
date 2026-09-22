import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateShelfCountTypeRequest,
    ShelfCountTypeResponse,
    UpdateShelfCountTypeRequest
} from '../../models/wms/shelf-count-type.models';

/** /api/wms/shelf-count-types - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsShelfCountTypesService extends WmsGlobalCrudService<
    ShelfCountTypeResponse,
    CreateShelfCountTypeRequest,
    UpdateShelfCountTypeRequest
> {
    protected readonly resource = 'shelf-count-types';
}

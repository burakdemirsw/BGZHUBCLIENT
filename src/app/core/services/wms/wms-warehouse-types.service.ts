import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateWarehouseTypeRequest,
    UpdateWarehouseTypeRequest,
    WarehouseTypeResponse,
} from '../../models/wms/warehouse.models';

/** /api/wms/warehouse-types — şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsWarehouseTypesService extends WmsGlobalCrudService<
    WarehouseTypeResponse,
    CreateWarehouseTypeRequest,
    UpdateWarehouseTypeRequest
> {
    protected readonly resource = 'warehouse-types';
}

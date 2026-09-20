import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import { ApiResponse } from '../../models/api-response.model';
import {
    CreateWarehouseRequest,
    UpdateWarehouseRequest,
    WarehouseResponse,
} from '../../models/wms/warehouse.models';

/** /api/wms/warehouses */
@Injectable({ providedIn: 'root' })
export class WmsWarehousesService extends WmsCompanyCrudService<
    WarehouseResponse,
    Omit<CreateWarehouseRequest, 'companyId'>,
    UpdateWarehouseRequest
> {
    protected readonly resource = 'warehouses';

    /** Depo koduna göre tekil kayıt — /warehouses/by-code/{companyId}/{warehouseCode} */
    getByCode(warehouseCode: string, companyId?: string): Promise<ApiResponse<WarehouseResponse>> {
        return this.http.get<WarehouseResponse>(
            this.action(`by-code/${companyId ?? this.companyId}/${warehouseCode}`),
        );
    }
}

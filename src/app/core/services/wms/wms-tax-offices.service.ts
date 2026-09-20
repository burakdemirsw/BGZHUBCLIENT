import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateWmsTaxOfficeRequest,
    UpdateWmsTaxOfficeRequest,
    WmsTaxOfficeResponse
} from '../../models/wms/tax-office.models';

/** /api/wms/tax-office - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsTaxOfficesService extends WmsGlobalCrudService<
    WmsTaxOfficeResponse,
    CreateWmsTaxOfficeRequest,
    UpdateWmsTaxOfficeRequest
> {
    protected readonly resource = 'tax-office';
}

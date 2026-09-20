import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateWmsCountryRequest,
    UpdateWmsCountryRequest,
    WmsCountryResponse,
} from '../../models/wms/location.models';

/** /api/wms/country — şirketten bağımsız lokasyon kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsCountriesService extends WmsGlobalCrudService<
    WmsCountryResponse,
    CreateWmsCountryRequest,
    UpdateWmsCountryRequest
> {
    protected readonly resource = 'country';
}

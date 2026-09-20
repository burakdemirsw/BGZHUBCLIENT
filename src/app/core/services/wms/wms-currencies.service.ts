import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateCurrencyRequest,
    CurrencyResponse,
    UpdateCurrencyRequest
} from '../../models/wms/currency.models';

/** /api/wms/currency - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsCurrenciesService extends WmsGlobalCrudService<
    CurrencyResponse,
    CreateCurrencyRequest,
    UpdateCurrencyRequest
> {
    protected readonly resource = 'currency';
}

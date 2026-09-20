import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateItemBarcodeTypeRequest,
    ItemBarcodeTypeResponse,
    UpdateItemBarcodeTypeRequest
} from '../../models/wms/item-barcode-type.models';

/** /api/wms/item-barcode-types - şirketten bağımsız tanım kaynağı */
@Injectable({ providedIn: 'root' })
export class WmsItemBarcodeTypesService extends WmsGlobalCrudService<
    ItemBarcodeTypeResponse,
    CreateItemBarcodeTypeRequest,
    UpdateItemBarcodeTypeRequest
> {
    protected readonly resource = 'item-barcode-types';
}

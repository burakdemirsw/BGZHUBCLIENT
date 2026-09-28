import { Injectable } from '@angular/core';
import { WmsGlobalCrudService } from './wms-crud.service';
import {
    CreateOrderTrackingSettingDefinitionRequest,
    OrderTrackingSettingDefinitionResponse,
    UpdateOrderTrackingSettingDefinitionRequest,
} from '../../models/wms/order-tracking-setting-definition.models';

/** /api/wms/order-tracking-setting-definitions - şirketten bağımsız ayar tanımları */
@Injectable({ providedIn: 'root' })
export class WmsOrderTrackingSettingDefinitionsService extends WmsGlobalCrudService<
    OrderTrackingSettingDefinitionResponse,
    CreateOrderTrackingSettingDefinitionRequest,
    UpdateOrderTrackingSettingDefinitionRequest
> {
    protected readonly resource = 'order-tracking-setting-definitions';
}

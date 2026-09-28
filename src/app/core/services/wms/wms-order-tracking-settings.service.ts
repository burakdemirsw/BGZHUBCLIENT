import { Injectable } from '@angular/core';
import { WmsCompanyCrudService } from './wms-crud.service';
import {
    CreateOrderTrackingSettingRequest,
    OrderTrackingSettingResponse,
    UpdateOrderTrackingSettingRequest,
} from '../../models/wms/order-tracking-setting.models';

/** /api/wms/order-tracking-settings - şirket bazlı sipariş takip ayarları */
@Injectable({ providedIn: 'root' })
export class WmsOrderTrackingSettingsService extends WmsCompanyCrudService<
    OrderTrackingSettingResponse,
    Omit<CreateOrderTrackingSettingRequest, 'companyId'>,
    UpdateOrderTrackingSettingRequest
> {
    protected readonly resource = 'order-tracking-settings';
}

import { WmsAuditFields } from './wms-common.models';

/**
 * Sipariş takip (OTP) şirket ayarı modelleri.
 * Kaynak: v1 (46).yaml - OrderTrackingSettingResponse / CreateOrderTrackingSettingRequest /
 * UpdateOrderTrackingSettingRequest (/api/wms/order-tracking-settings)
 *
 * Her kayıt, tanım listesindeki bir `settingKey` için şirketin verdiği değeri tutar.
 */
export interface OrderTrackingSettingResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    settingKey: string | null;
    settingValue: string | null;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateOrderTrackingSettingRequest extends UpdateOrderTrackingSettingRequest {
    companyId: string;
}

export interface UpdateOrderTrackingSettingRequest {
    settingKey: string | null;
    settingValue: string | null;
}

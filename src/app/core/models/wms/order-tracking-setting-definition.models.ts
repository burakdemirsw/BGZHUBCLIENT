import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Sipariş takip (OTP) ayar tanımı modelleri — şirketten bağımsız.
 * Kaynak: v1 (46).yaml - OrderTrackingSettingDefinitionResponse /
 * CreateOrderTrackingSettingDefinitionRequest / UpdateOrderTrackingSettingDefinitionRequest
 * (/api/wms/order-tracking-setting-definitions)
 *
 * `dataType` ve `inputType` yaml'da serbest metin — olası değerler şemada sayılmamış.
 */
export interface OrderTrackingSettingDefinitionResponse extends WmsAuditFields {
    id: string;
    settingKey: string | null;
    displayName: string | null;
    description: string | null;
    dataType: string | null;
    inputType: string | null;
    isRequired: boolean;
    placeholder: string | null;
    defaultValue: string | null;
    sortOrder: WmsCode;
    isActive: boolean;
}

export interface CreateOrderTrackingSettingDefinitionRequest {
    settingKey: string | null;
    displayName: string | null;
    description: string | null;
    dataType: string | null;
    inputType: string | null;
    isRequired: boolean;
    placeholder: string | null;
    defaultValue: string | null;
    sortOrder: WmsCode;
    isActive: boolean;
}

export type UpdateOrderTrackingSettingDefinitionRequest = CreateOrderTrackingSettingDefinitionRequest;

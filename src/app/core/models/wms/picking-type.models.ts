import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Toplama tipi modelleri (şirketten bağımsız).
 * Kaynak: v1.yaml - PickingTypeResponse / CreatePickingTypeRequest / UpdatePickingTypeRequest
 * `direction` yaml'da açıklamasız integer — değer anlamları tanımlı değil.
 */
export interface PickingTypeResponse extends WmsAuditFields {
    id: string;
    pickingTypeCode: string | null;
    pickingTypeDescription: string | null;
    direction: WmsCode;
    isActive: boolean;
}

export interface CreatePickingTypeRequest {
    pickingTypeCode: string | null;
    pickingTypeDescription: string | null;
    direction: WmsCode;
    isActive: boolean;
}

export type UpdatePickingTypeRequest = CreatePickingTypeRequest;

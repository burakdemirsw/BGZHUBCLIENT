import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Ürün tipi modelleri (şirketten bağımsız).
 * Kaynak: v1.yaml - ItemTypeResponse / CreateItemTypeRequest / UpdateItemTypeRequest
 */
export interface ItemTypeResponse extends WmsAuditFields {
    id: string;
    itemTypeCode: WmsCode;
    itemTypeDescription: string | null;
    isActive: boolean;
}

export interface CreateItemTypeRequest {
    itemTypeCode: WmsCode;
    itemTypeDescription: string | null;
    isActive: boolean;
}

export type UpdateItemTypeRequest = CreateItemTypeRequest;

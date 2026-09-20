import { WmsAuditFields } from './wms-common.models';

/**
 * Barkod tipi modelleri (şirketten bağımsız).
 * Kaynak: v1.yaml - ItemBarcodeTypeResponse / CreateItemBarcodeTypeRequest / UpdateItemBarcodeTypeRequest
 */
export interface ItemBarcodeTypeResponse extends WmsAuditFields {
    id: string;
    barcodeTypeCode: string | null;
    barcodeTypeDescription: string | null;
    barcodeLength: number | string | null;
    isActive: boolean;
}

export interface CreateItemBarcodeTypeRequest {
    barcodeTypeCode: string | null;
    barcodeTypeDescription: string | null;
    barcodeLength: number | null;
    isActive: boolean;
}

export type UpdateItemBarcodeTypeRequest = CreateItemBarcodeTypeRequest;

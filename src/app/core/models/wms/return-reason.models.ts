import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade nedeni modelleri (şirket bazlı).
 * Kaynak: v1 (46).yaml - ReturnReasonResponse / CreateReturnReasonRequest /
 * UpdateReturnReasonRequest (/api/wms/return-reasons)
 *
 * Sipariş takip panelindeki "Neden iade ediyorsunuz?" listesini besler.
 */
export interface ReturnReasonResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    returnCode: string | null;
    returnReasonDescription: string | null;
    sortOrder: WmsCode;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateReturnReasonRequest extends UpdateReturnReasonRequest {
    companyId: string;
}

export interface UpdateReturnReasonRequest {
    returnCode: string | null;
    returnReasonDescription: string | null;
    sortOrder: WmsCode;
    isActive: boolean;
}

import { WmsAuditFields } from './wms-common.models';

/**
 * Parti modelleri.
 * Kaynak: v1.yaml - BatchResponse / CreateBatchRequest / UpdateBatchRequest
 */
export interface BatchResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    batchCode: string | null;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateBatchRequest extends UpdateBatchRequest {
    companyId: string;
}

export interface UpdateBatchRequest {
    batchCode: string | null;
    isActive: boolean;
}

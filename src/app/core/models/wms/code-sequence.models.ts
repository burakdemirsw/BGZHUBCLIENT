import { WmsAuditFields } from './wms-common.models';

/**
 * Kod sekansı modelleri. Bu kaynakta `isActive` alanı bulunmaz.
 * Kaynak: v1.yaml - CodeSequenceResponse / CreateCodeSequenceRequest / UpdateCodeSequenceRequest
 */
export interface CodeSequenceResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    sequenceCode: string | null;
    lastNumber: number | string;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateCodeSequenceRequest extends UpdateCodeSequenceRequest {
    companyId: string;
}

export interface UpdateCodeSequenceRequest {
    sequenceCode: string | null;
    lastNumber: number;
}

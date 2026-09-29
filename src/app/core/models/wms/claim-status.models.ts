import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade talebi durumları (şirketten bağımsız).
 * Kaynak: v1 (51).yaml - ClaimStatusResponse / CreateClaimStatusRequest /
 * UpdateClaimStatusRequest (/api/wms/claim-status)
 *
 * `matchKeywords`, pazaryerinden gelen durum metnini bu koda eşlemek için kullanılır.
 * `isClosed` işaretli durumlar talebin kapandığını belirtir.
 */
export interface ClaimStatusResponse extends WmsAuditFields {
    id: string;
    statusCode: WmsCode;
    statusDescription: string | null;
    matchKeywords: string | null;
    isClosed: boolean;
    sortOrder: WmsCode;
    isActive: boolean;
}

export interface CreateClaimStatusRequest {
    statusCode: WmsCode;
    statusDescription: string | null;
    matchKeywords: string | null;
    isClosed: boolean;
    sortOrder: WmsCode;
    isActive: boolean;
}

export type UpdateClaimStatusRequest = CreateClaimStatusRequest;

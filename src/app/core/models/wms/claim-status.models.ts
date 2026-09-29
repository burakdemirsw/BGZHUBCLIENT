import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade talebi durumları (şirketten bağımsız).
 * Kaynak: v1 (52).yaml - ReturnClaimStatusResponse / CreateReturnClaimStatusRequest /
 * UpdateReturnClaimStatusRequest (/api/wms/return-claim-status)
 *
 * `isClosed` işaretli durumlar talebin kapandığını belirtir.
 */
export interface ClaimStatusResponse extends WmsAuditFields {
    id: string;
    statusCode: WmsCode;
    statusDescription: string | null;
    isClosed: boolean;
    sortOrder: WmsCode;
    isActive: boolean;
}

export interface CreateClaimStatusRequest {
    statusCode: WmsCode;
    statusDescription: string | null;
    isClosed: boolean;
    sortOrder: WmsCode;
    isActive: boolean;
}

export type UpdateClaimStatusRequest = CreateClaimStatusRequest;

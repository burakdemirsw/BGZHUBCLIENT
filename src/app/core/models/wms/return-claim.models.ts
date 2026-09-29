import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade talebi (başlık) modelleri.
 * Kaynak: v1 (52).yaml - ReturnClaimResponse / CreateReturnClaimRequest /
 * UpdateReturnClaimRequest (/api/wms/return-claims)
 *
 * Talepler müşteri panelinden ya da pazaryeri aktarımından oluşur; yönetim
 * ekranı bunları yalnızca listeler ve detayını gösterir.
 */
export interface ReturnClaimResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    claimNumber: string | null;
    orderNumber: string | null;
    extensionCode: string | null;
    companyExtensionId: string | null;
    /** Pazaryerindeki talep kimliği */
    externalClaimId: string | null;
    syncSource: WmsCode;
    claimDate: string | null;
    statusCode: WmsCode;
    returnReasonCode: string | null;
    afterReturnActionCode: string | null;
    customerNote: string | null;
    sourceLastModifiedDate: string | null;
    payloadHash: string | null;
    cargoExtensionId: string | null;
    cargoTrackingNumber: string | null;
    receivedDate: string | null;
    note: string | null;
    lastSyncedDate: string | null;
    createdIp: string | null;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateReturnClaimRequest extends UpdateReturnClaimRequest {
    companyId: string;
}

export interface UpdateReturnClaimRequest {
    claimNumber: string | null;
    orderNumber: string | null;
    extensionCode: string | null;
    companyExtensionId: string | null;
    externalClaimId: string | null;
    syncSource: WmsCode;
    claimDate: string | null;
    statusCode: WmsCode;
    returnReasonCode: string | null;
    afterReturnActionCode: string | null;
    customerNote: string | null;
    sourceLastModifiedDate: string | null;
    payloadHash: string | null;
    cargoExtensionId: string | null;
    cargoTrackingNumber: string | null;
    receivedDate: string | null;
    note: string | null;
    lastSyncedDate: string | null;
    createdIp: string | null;
}

/**
 * İade talebi satırı.
 * Kaynak: v1 (50).yaml - ReturnClaimLineResponse (/api/wms/return-claim-lines)
 */
export interface ReturnClaimLineResponse extends WmsAuditFields {
    id: string;
    claimHeaderId: string;
    companyId: string;
    sortOrder: WmsCode;
    orderLineId: string | null;
    externalClaimLineId: string | null;
    sourceItemCode: string | null;
    /** Sağlayıcıdaki ürün görseli */
    sourceImageUrl: string | null;
    itemCode: string | null;
    colorCode: string | null;
    batchCode: string | null;
    usedBarcode: string | null;
    quantity: WmsCode;
    acceptedQuantity: WmsCode;
    rejectedQuantity: WmsCode;
    returnReasonCode: string | null;
    sourceReason: string | null;
    customerNote: string | null;
    statusCode: WmsCode;
    createdIp: string | null;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateReturnClaimLineRequest extends UpdateReturnClaimLineRequest {
    companyId: string;
}

export interface UpdateReturnClaimLineRequest {
    claimHeaderId: string;
    sortOrder: WmsCode;
    orderLineId: string | null;
    externalClaimLineId: string | null;
    sourceItemCode: string | null;
    sourceImageUrl: string | null;
    itemCode: string | null;
    colorCode: string | null;
    batchCode: string | null;
    usedBarcode: string | null;
    quantity: WmsCode;
    acceptedQuantity: WmsCode;
    rejectedQuantity: WmsCode;
    returnReasonCode: string | null;
    sourceReason: string | null;
    customerNote: string | null;
    statusCode: WmsCode;
    createdIp: string | null;
}

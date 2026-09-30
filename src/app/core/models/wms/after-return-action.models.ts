import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade sonrası işlem tipleri (sistem geneli — şirket bazlı değil).
 * Kaynak: v1 (46).yaml - AfterReturnClaimActionResponse / CreateAfterReturnClaimActionRequest /
 * UpdateAfterReturnClaimActionRequest (/api/wms/after-return-claim-actions)
 *
 * Sipariş takip panelinde 2. adımdaki "Nasıl bir işlem talep ediyorsunuz?"
 * listesini besler (kredi kartına iade, hediye çeki, değişim vb.).
 * Seçenekler tüm şirketlerde ortaktır, `actionCode` sistem genelinde tekildir.
 * Şemada `isActive` alanı yok — kayıt pasife alınamaz, silinir.
 */
export interface AfterReturnActionResponse extends WmsAuditFields {
    id: string;
    actionCode: string | null;
    actionDescription: string | null;
    sortOrder: WmsCode;
}

/** Şirketsiz kaynak — oluşturma isteği `companyId` taşımaz */
export type CreateAfterReturnActionRequest = UpdateAfterReturnActionRequest;

export interface UpdateAfterReturnActionRequest {
    actionCode: string | null;
    actionDescription: string | null;
    sortOrder: WmsCode;
}

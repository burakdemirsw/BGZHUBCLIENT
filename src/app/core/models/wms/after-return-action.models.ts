import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade sonrası işlem tipleri (şirket bazlı).
 * Kaynak: v1 (46).yaml - AfterReturnActionResponse / CreateAfterReturnActionRequest /
 * UpdateAfterReturnActionRequest (/api/wms/after-return-actions)
 *
 * Sipariş takip panelinde 2. adımdaki "Nasıl bir işlem talep ediyorsunuz?"
 * listesini besler (kredi kartına iade, hediye çeki, değişim vb.).
 * Şemada `isActive` alanı yok — kayıt pasife alınamaz, silinir.
 */
export interface AfterReturnActionResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    actionCode: string | null;
    actionDescription: string | null;
    sortOrder: WmsCode;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateAfterReturnActionRequest extends UpdateAfterReturnActionRequest {
    companyId: string;
}

export interface UpdateAfterReturnActionRequest {
    actionCode: string | null;
    actionDescription: string | null;
    sortOrder: WmsCode;
}

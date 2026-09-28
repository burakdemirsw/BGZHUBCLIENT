import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade talebi öncesi bilgilendirme maddeleri (şirket bazlı).
 * Kaynak: v1 (46).yaml - BeforeClaimInstructionResponse /
 * CreateBeforeClaimInstructionRequest / UpdateBeforeClaimInstructionRequest
 * (/api/wms/before-claim-instructions)
 *
 * Sipariş takip panelindeki "Talep Oluşturmadan Önce Bilmeniz Gerekenler"
 * modalındaki maddeler bu kayıtlardan üretilir.
 */
export interface BeforeClaimInstructionResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    sortOrder: WmsCode;
    content: string | null;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateBeforeClaimInstructionRequest extends UpdateBeforeClaimInstructionRequest {
    companyId: string;
}

export interface UpdateBeforeClaimInstructionRequest {
    sortOrder: WmsCode;
    content: string | null;
}

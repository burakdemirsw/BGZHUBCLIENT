import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * İade kargo şirketi tanımları (şirket bazlı).
 * Kaynak: v1 (48).yaml - ClaimCargoCompanyResponse / CreateClaimCargoCompanyRequest /
 * UpdateClaimCargoCompanyRequest (/api/wms/claim-cargo-companies)
 *
 * Sipariş takip panelinde iade talebinin 3. adımındaki kargo şirketi listesini besler;
 * `customerNo` ve `accountTitle` müşteriye gösterilen "Kargo Cari Bilgimiz" alanıdır.
 */
export interface ClaimCargoCompanyResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    /** WMS kargo şirketi kodu (dbo.DeliveryCompany) */
    deliveryCompanyCode: string | null;
    /** Kargo entegrasyonunun extension kaydı */
    cargoExtensionId: string | null;
    customerNo: string | null;
    accountTitle: string | null;
    sortOrder: WmsCode;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateClaimCargoCompanyRequest extends UpdateClaimCargoCompanyRequest {
    companyId: string;
}

export interface UpdateClaimCargoCompanyRequest {
    deliveryCompanyCode: string | null;
    cargoExtensionId: string | null;
    customerNo: string | null;
    accountTitle: string | null;
    sortOrder: WmsCode;
    isActive: boolean;
}

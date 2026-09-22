/**
 * WMS API'sinde tekrar eden ortak tipler.
 * Kaynak: src/assets/api/v1.yaml — /api/wms/* endpoint'leri.
 */

/** Tüm WMS kayıtlarının taşıdığı kimlik alanı */
export interface WmsEntity {
    id: string;
}

/** Denetim (audit) alanları — çoğu WMS response'unda bulunur */
export interface WmsAuditFields {
    createdUserId?: string;
    createdDate?: string;
    lastUpdatedUserId?: string;
    updatedDate?: string;
}

/**
 * WMS'te kod alanları `uint8` olarak tanımlı; OpenAPI şeması hem `integer`
 * hem `string` kabul ettiği için (`type: [integer, string]`) ikisini de karşılar.
 */
export type WmsCode = number | string;

/** Şirket bazlı kaynakların ortak alanı */
export interface WmsCompanyScoped {
    companyId: string;
}

/** Para birimi bazında toplam — ör. müşterinin TRY ve USD cinsinden ciroları */
export interface WmsCurrencyAmount {
    currencyCode: string;
    amount: number;
}

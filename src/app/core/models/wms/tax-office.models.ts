import { WmsAuditFields } from './wms-common.models';

/**
 * Vergi dairesi modelleri (şirketten bağımsız).
 * Ad çakışmasını önlemek için WMS öneki kullanılır; projede ayrı bir
 * `models/tax-office` alanı da bulunur.
 * Kaynak: v1.yaml - TaxOfficeResponse / CreateTaxOfficeRequest / UpdateTaxOfficeRequest
 */
export interface WmsTaxOfficeResponse extends WmsAuditFields {
    id: string;
    taxOfficeCode: string | null;
    cityCode: string | null;
    isActive: boolean;
}

export interface CreateWmsTaxOfficeRequest {
    taxOfficeCode: string | null;
    cityCode: string | null;
    isActive: boolean;
}

export type UpdateWmsTaxOfficeRequest = CreateWmsTaxOfficeRequest;

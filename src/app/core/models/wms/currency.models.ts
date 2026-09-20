import { WmsAuditFields } from './wms-common.models';

/**
 * Para birimi modelleri (şirketten bağımsız).
 * Kaynak: v1.yaml - CurrencyResponse / CreateCurrencyRequest / UpdateCurrencyRequest
 */
export interface CurrencyResponse extends WmsAuditFields {
    id: string;
    currencyCode: string | null;
    isActive: boolean;
}

export interface CreateCurrencyRequest {
    currencyCode: string | null;
    isActive: boolean;
}

export type UpdateCurrencyRequest = CreateCurrencyRequest;

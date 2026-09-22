import { WmsAuditFields } from './wms-common.models';

/**
 * Raf sayım tipi modelleri (şirketten bağımsız).
 * Kaynak: v1.yaml - ShelfCountTypeResponse / CreateShelfCountTypeRequest / UpdateShelfCountTypeRequest
 */
export interface ShelfCountTypeResponse extends WmsAuditFields {
    id: string;
    shelfCountTypeCode: string | null;
    shelfCountTypeDescription: string | null;
    /** Kör sayım: sayım yapan beklenen miktarı görmez */
    isBlind: boolean;
    isActive: boolean;
}

export interface CreateShelfCountTypeRequest {
    shelfCountTypeCode: string | null;
    shelfCountTypeDescription: string | null;
    isBlind: boolean;
    isActive: boolean;
}

export type UpdateShelfCountTypeRequest = CreateShelfCountTypeRequest;

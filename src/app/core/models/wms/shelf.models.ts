import { WmsAuditFields } from './wms-common.models';

/**
 * Raf modelleri.
 * Kaynak: v1.yaml - ShelfResponse / CreateShelfRequest / UpdateShelfRequest
 */
export interface ShelfResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    officeCode: string | null;
    warehouseCode: string | null;
    shelfCode: string | null;
    shelfDescription: string | null;
    shelfBarcode: string | null;
    parentShelfCode: string | null;
    zone: string | null;
    aisle: string | null;
    bay: string | null;
    shelfLevel: string | null;
    pickSequence: number | string | null;
    capacity: number | string | null;
    maxWeight: number | string | null;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateShelfRequest extends UpdateShelfRequest {
    companyId: string;
}

export interface UpdateShelfRequest {
    officeCode: string | null;
    warehouseCode: string | null;
    shelfCode: string | null;
    shelfDescription: string | null;
    shelfBarcode: string | null;
    parentShelfCode: string | null;
    zone: string | null;
    aisle: string | null;
    bay: string | null;
    shelfLevel: string | null;
    pickSequence: number | null;
    capacity: number | null;
    maxWeight: number | null;
    isActive: boolean;
}

import { WmsAuditFields } from './wms-common.models';

/**
 * Renk modelleri.
 * Kaynak: v1.yaml - ColorResponse / CreateColorRequest / UpdateColorRequest
 */
export interface ColorResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    colorCode: string | null;
    sortOrder: number | string;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateColorRequest extends UpdateColorRequest {
    companyId: string;
}

export interface UpdateColorRequest {
    colorCode: string | null;
    sortOrder: number;
    isActive: boolean;
}

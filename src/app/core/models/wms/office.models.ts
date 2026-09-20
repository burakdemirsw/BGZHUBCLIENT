import { WmsAuditFields } from './wms-common.models';

/**
 * Ofis modelleri.
 * Kaynak: v1.yaml - OfficeResponse / CreateOfficeRequest / UpdateOfficeRequest
 */
export interface OfficeResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    officeCode: string | null;
    officeDescription: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateOfficeRequest extends UpdateOfficeRequest {
    companyId: string;
}

export interface UpdateOfficeRequest {
    officeCode: string | null;
    officeDescription: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
}

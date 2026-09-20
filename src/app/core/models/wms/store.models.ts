import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Mağaza modelleri.
 * Kaynak: v1.yaml - StoreResponse / CreateStoreRequest / UpdateStoreRequest
 */
export interface StoreResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    storeCode: string | null;
    officeCode: string | null;
    storeDescription: string | null;
    customerTypeCode: WmsCode;
    customerCode: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
}

/** companyId servis katmanında eklenir - forma girmez */
export interface CreateStoreRequest extends UpdateStoreRequest {
    companyId: string;
}

export interface UpdateStoreRequest {
    storeCode: string | null;
    officeCode: string | null;
    storeDescription: string | null;
    customerTypeCode: WmsCode;
    customerCode: string | null;
    phone: string | null;
    email: string | null;
    isActive: boolean;
}

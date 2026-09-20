import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Depo modelleri.
 * Kaynak: v1.yaml — WarehouseResponse / CreateWarehouseRequest / UpdateWarehouseRequest
 */
export interface WarehouseResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    officeCode: string;
    officeDescription: string | null;
    /** Sunucu tarafından üretilir, istekte gönderilmez */
    warehouseCode: string;
    warehouseDescription: string;
    warehouseTypeCode: WmsCode;
    isDefault: boolean;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

/** companyId servis katmanında AuthStateService'ten eklenir — forma girmez */
export interface CreateWarehouseRequest {
    companyId: string;
    officeCode: string;
    warehouseDescription: string;
    warehouseTypeCode: WmsCode;
    isDefault: boolean;
    isActive: boolean;
}

export interface UpdateWarehouseRequest {
    officeCode: string;
    warehouseDescription: string;
    warehouseTypeCode: WmsCode;
    isDefault: boolean;
    isActive: boolean;
}

/**
 * Depo tipi modelleri (şirketten bağımsız / global kaynak).
 * Kaynak: v1.yaml — WarehouseTypeResponse / CreateWarehouseTypeRequest / UpdateWarehouseTypeRequest
 */
export interface WarehouseTypeResponse extends WmsAuditFields {
    id: string;
    warehouseTypeCode: WmsCode;
    warehouseTypeDescription: string | null;
    isActive: boolean;
}

export interface CreateWarehouseTypeRequest {
    warehouseTypeCode: WmsCode;
    warehouseTypeDescription: string | null;
    isActive: boolean;
}

export interface UpdateWarehouseTypeRequest {
    warehouseTypeCode: WmsCode;
    warehouseTypeDescription: string | null;
    isActive: boolean;
}

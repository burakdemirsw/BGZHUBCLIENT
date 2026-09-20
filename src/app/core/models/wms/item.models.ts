import { WmsAuditFields, WmsCode } from './wms-common.models';

/**
 * Ürün tanım modelleri.
 * Kaynak: v1.yaml — Item / ItemAttribute / ItemAttributeType /
 * ItemAttributeAssignment / ItemBasePrice / ItemDim1 / ItemTestType.
 *
 * Şirket bazlı kaynaklardır; `companyId` servis katmanında eklenir, forma girmez.
 */

export interface ItemResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    itemTypeCode: WmsCode;
    itemCode: string | null;
    isActive: boolean;
}

export interface UpdateItemRequest {
    itemTypeCode: WmsCode;
    itemCode: string | null;
    isActive: boolean;
}

export interface CreateItemRequest extends UpdateItemRequest {
    companyId: string;
}

/** Ürün özellik tipi — ör. Beden, Kalıp */
export interface ItemAttributeTypeResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    attributeTypeCode: string | null;
    sortOrder: number | string;
    isActive: boolean;
}

export interface UpdateItemAttributeTypeRequest {
    attributeTypeCode: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface CreateItemAttributeTypeRequest extends UpdateItemAttributeTypeRequest {
    companyId: string;
}

/** Bir özellik tipinin alabileceği değer — ör. Beden → XL */
export interface ItemAttributeResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    attributeTypeCode: string | null;
    attributeCode: string | null;
    isActive: boolean;
}

export interface UpdateItemAttributeRequest {
    attributeTypeCode: string | null;
    attributeCode: string | null;
    isActive: boolean;
}

export interface CreateItemAttributeRequest extends UpdateItemAttributeRequest {
    companyId: string;
}

/** Ürüne özellik ataması. Bu kaynakta `isActive` alanı bulunmaz. */
export interface ItemAttributeAssignmentResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    itemCode: string | null;
    attributeTypeCode: string | null;
    attributeCode: string | null;
}

export interface UpdateItemAttributeAssignmentRequest {
    itemCode: string | null;
    attributeTypeCode: string | null;
    attributeCode: string | null;
}

export interface CreateItemAttributeAssignmentRequest
    extends UpdateItemAttributeAssignmentRequest {
    companyId: string;
}

/** Ürün temel fiyatı. Bu kaynakta `isActive` alanı bulunmaz. */
export interface ItemBasePriceResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    basePriceCode: string | null;
    itemCode: string | null;
    colorCode: string | null;
    itemDim1Code: string | null;
    /** yyyy-MM-dd */
    priceDate: string;
    currencyCode: string | null;
    price: number | string;
}

export interface UpdateItemBasePriceRequest {
    basePriceCode: string | null;
    itemCode: string | null;
    colorCode: string | null;
    itemDim1Code: string | null;
    priceDate: string;
    currencyCode: string | null;
    price: number;
}

export interface CreateItemBasePriceRequest extends UpdateItemBasePriceRequest {
    companyId: string;
}

/** Ürün 1. boyutu — ör. beden ölçüsü */
export interface ItemDim1Response extends WmsAuditFields {
    id: string;
    companyId: string;
    itemDim1Code: string | null;
    sortOrder: number | string;
    isActive: boolean;
}

export interface UpdateItemDim1Request {
    itemDim1Code: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface CreateItemDim1Request extends UpdateItemDim1Request {
    companyId: string;
}

export interface ItemTestTypeResponse extends WmsAuditFields {
    id: string;
    companyId: string;
    itemTestTypeCode: string | null;
    isActive: boolean;
}

export interface UpdateItemTestTypeRequest {
    itemTestTypeCode: string | null;
    isActive: boolean;
}

export interface CreateItemTestTypeRequest extends UpdateItemTestTypeRequest {
    companyId: string;
}

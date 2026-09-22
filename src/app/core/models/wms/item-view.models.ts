import { PaginationRequest } from '../pagination.model';
import { WmsOrderListItem } from './order-view.models';

/**
 * Ürün liste ve detay görünüm modelleri.
 * Kaynak: v1.yaml — POST /api/wms/items/list, GET /api/wms/items/{id}/details
 */

/** Liste filtreleri — sayfalama alanları dışında kalanlar */
export interface WmsItemListFilter {
    itemTypeCode?: number | null;
    isActive?: boolean | null;
    colorCode?: string | null;
    itemDim1Code?: string | null;
}

export interface WmsItemListRequest extends PaginationRequest, WmsItemListFilter {}

export interface WmsItemListItem {
    id: string;
    itemTypeCode: number;
    itemTypeDescription: string | null;
    itemCode: string;
    itemDescription: string | null;
    imageUrl: string | null;
    variantCount: number;
    barcodeCount: number;
    defaultBarcode: string | null;
    stockQuantity: number;
    isActive: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface WmsItemCardDetail {
    id: string;
    companyId: string;
    itemTypeCode: number;
    itemTypeDescription: string | null;
    itemCode: string;
    itemDescription: string | null;
    longDescription: string | null;
    imageUrl: string | null;
    stockQuantity: number;
    isActive: boolean;
    createdUserId: string;
    createdUserName: string | null;
    lastUpdatedUserId: string;
    lastUpdatedUserName: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface WmsItemDescriptionDetail {
    langCode: string;
    itemDescription: string;
    longDescription: string | null;
}

export interface WmsItemVariantDetail {
    id: string;
    colorCode: string | null;
    colorDescription: string | null;
    itemDim1Code: string | null;
    itemDim1Description: string | null;
    imageUrl: string | null;
    useInternet: boolean;
    isActive: boolean;
    stockQuantity: number;
    /** Varyanta bağlı barkodlar, virgülle ayrılmış */
    barcodes: string;
}

export interface WmsItemBarcodeDetail {
    id: string;
    barcode: string;
    barcodeTypeCode: string;
    barcodeTypeDescription: string | null;
    colorCode: string | null;
    itemDim1Code: string | null;
    quantity: number;
    sourceProvider: string | null;
    externalVariantId: string | null;
    isDefault: boolean;
}

export interface WmsItemPriceDetail {
    id: string;
    basePriceCode: string;
    basePriceDescription: string | null;
    colorCode: string | null;
    itemDim1Code: string | null;
    priceDate: string;
    currencyCode: string;
    price: number;
    isVatIncluded: boolean | null;
}

export interface WmsItemAttributeDetail {
    attributeTypeCode: string;
    attributeTypeDescription: string | null;
    attributeCode: string;
    attributeDescription: string | null;
}

export interface WmsItemNoteDetail {
    lineNumber: number;
    note: string;
}

/** Depo bazında stok bakiyesi */
export interface WmsItemStockDetail {
    officeCode: string;
    warehouseCode: string;
    warehouseDescription: string | null;
    colorCode: string | null;
    itemDim1Code: string | null;
    inQuantity: number;
    outQuantity: number;
    quantity: number;
}

/** Raf bazında stok bakiyesi */
export interface WmsItemShelfStockDetail {
    warehouseCode: string;
    shelfCode: string;
    colorCode: string | null;
    itemDim1Code: string | null;
    batchCode: string | null;
    quantity: number;
    lastMovementDate: string | null;
    lastCountDate: string | null;
}

export interface WmsItemOrderStats {
    orderCount: number;
    orderedQuantity: number;
    cancelledQuantity: number;
    returnedQuantity: number;
    lastOrderDate: string | null;
}

export interface WmsItemDetailResponse {
    card: WmsItemCardDetail;
    descriptions: WmsItemDescriptionDetail[];
    variants: WmsItemVariantDetail[];
    barcodes: WmsItemBarcodeDetail[];
    prices: WmsItemPriceDetail[];
    attributes: WmsItemAttributeDetail[];
    notes: WmsItemNoteDetail[];
    stocks: WmsItemStockDetail[];
    shelfStocks: WmsItemShelfStockDetail[];
    orderStats: WmsItemOrderStats;
    recentOrders: WmsOrderListItem[];
}

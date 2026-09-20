/**
 * ExtensionController → Boyner uç noktalarının request/response modelleri.
 * Kaynak: src/assets/api/v1.yaml (Boyner* şemaları)
 * Boyner tarih alanları (orderDate, createDateTime vb.) epoch (ms) olarak döner.
 */
import { MarketplacePagedResponse } from './marketplace.models';

// ══════════════════════════════════════
//  SİPARİŞLER
// ══════════════════════════════════════

export interface BoynerOrderQuery {
    orderNumber?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    /** 0 tabanlı sayfa numarası */
    page?: number;
    size?: number;
}

export interface BoynerAddress {
    id?: number | string | null;
    fullName?: string | null;
    company?: string | null;
    address1?: string | null;
    address2?: string | null;
    fullAddress?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    countryName?: string | null;
    cityCode?: string | null;
    cityName?: string | null;
    districtCode?: string | null;
    districtName?: string | null;
    neighborhoodCode?: string | null;
    neighborhoodName?: string | null;
    phone?: string | null;
    taxOffice?: string | null;
    taxNumber?: string | null;
}

export interface BoynerOrderLine {
    id?: number | string | null;
    quantity?: number | null;
    productName?: string | null;
    productCode?: string | null;
    productSize?: string | null;
    productColor?: string | null;
    merchantSku?: string | null;
    merchantId?: number | string | null;
    sku?: string | null;
    barcode?: string | null;
    salesCampaignId?: number | string | null;
    price?: number | null;
    discount?: number | null;
    vatBaseAmount?: number | null;
    currencyCode?: string | null;
    orderLineItemStatusName?: string | null;
    /** ISO tarih-saat */
    estimatedDeliveryEndDate?: string | null;
    cargoProviderName?: string | null;
    discountDetails?: unknown[] | null;
}

export interface BoynerPackageHistory {
    /** epoch (ms) */
    createdDate?: number | null;
    status?: string | null;
}

export interface BoynerOrder {
    id?: number | string | null;
    orderId?: number | string | null;
    orderNumber?: string | null;
    packageNumber?: string | null;
    /** epoch (ms) */
    orderDate?: number | null;
    status?: string | null;
    shipmentPackageStatus?: string | null;
    grossAmount?: number | null;
    totalDiscount?: number | null;
    totalPrice?: number | null;
    currencyCode?: string | null;
    customerId?: number | string | null;
    customerFullName?: string | null;
    customerEmail?: string | null;
    tcIdentityNumber?: string | null;
    taxNumber?: string | null;
    cargoTrackingNumber?: string | null;
    cargoTrackingLink?: string | null;
    cargoSenderNumber?: string | null;
    cargoProviderName?: string | null;
    isSellerCarrier?: boolean | null;
    deliveryType?: string | null;
    deliveryAddressType?: string | null;
    /** epoch (ms) */
    agreedDeliveryDate?: number | null;
    /** epoch (ms) */
    originShipmentDate?: number | null;
    /** epoch (ms) */
    lastModifiedDate?: number | null;
    invoiceLink?: string | null;
    fastDelivery?: boolean | null;
    fastDeliveryType?: string | null;
    commercial?: boolean | null;
    shipmentAddress?: BoynerAddress | null;
    invoiceAddress?: BoynerAddress | null;
    lines?: BoynerOrderLine[] | null;
    packageHistories?: BoynerPackageHistory[] | null;
}

export type BoynerOrderResponse = MarketplacePagedResponse<BoynerOrder>;

// ══════════════════════════════════════
//  ÜRÜNLER
// ══════════════════════════════════════

export interface BoynerProductQuery {
    barcode?: string | null;
    stockCode?: string | null;
    productMainId?: string | null;
    isApproved?: boolean | null;
    isOnSale?: boolean | null;
    isArchived?: boolean | null;
    /** 0 tabanlı sayfa numarası */
    page?: number;
    size?: number;
}

export interface BoynerProductImage {
    url?: string | null;
}

export interface BoynerProduct {
    id?: string | null;
    barcode?: string | null;
    stockCode?: string | null;
    productMainId?: string | null;
    productContentId?: number | string | null;
    title?: string | null;
    brand?: string | null;
    categoryName?: string | null;
    color?: string | null;
    size?: string | null;
    quantity?: number | null;
    salePrice?: number | null;
    listPrice?: number | null;
    vatRate?: number | null;
    currencyType?: string | null;
    approved?: boolean | null;
    onSale?: boolean | null;
    archived?: boolean | null;
    locked?: boolean | null;
    productUrl?: string | null;
    /** epoch (ms) */
    createDateTime?: number | null;
    /** epoch (ms) */
    lastUpdateDate?: number | null;
    images?: BoynerProductImage[] | null;
}

export type BoynerProductResponse = MarketplacePagedResponse<BoynerProduct>;

// ══════════════════════════════════════
//  STOK SORGU (tek ürün kırılımı, sayfalama yok)
// ══════════════════════════════════════

export interface BoynerProductStockQuery {
    barcode?: string | null;
    productCode?: string | null;
}

export interface BoynerProductStockItem {
    barcode?: string | null;
    stockCode?: string | null;
    productMainId?: string | null;
    title?: string | null;
    color?: string | null;
    size?: string | null;
    quantity?: number | null;
    salePrice?: number | null;
    listPrice?: number | null;
    isOnSale?: boolean | null;
}

export interface BoynerProductStockResponse {
    barcode?: string | null;
    productCode?: string | null;
    totalQuantity?: number | null;
    items?: BoynerProductStockItem[] | null;
}

// ══════════════════════════════════════
//  TOPLU İŞLEM SORGUSU (batch)
// ══════════════════════════════════════

export interface BoynerBatchRequestQuery {
    batchRequestId?: string | null;
}

export interface BoynerBatchRequestItemPayload {
    barcode?: string | null;
    quantity?: number | null;
    salePrice?: number | null;
    listPrice?: number | null;
}

export interface BoynerBatchRequestItem {
    requestItem?: BoynerBatchRequestItemPayload | null;
    status?: string | null;
    failureReasons?: string[] | null;
}

export interface BoynerBatchRequestResultResponse {
    batchRequestId?: string | null;
    status?: string | null;
    itemCount?: number | null;
    failedItemCount?: number | null;
    /** epoch (ms) */
    creationDate?: number | null;
    /** epoch (ms) */
    lastModification?: number | null;
    items?: BoynerBatchRequestItem[] | null;
}

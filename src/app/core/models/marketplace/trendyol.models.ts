/**
 * ExtensionController → Trendyol uç noktalarının request/response modelleri.
 * Kaynak: src/assets/api/v1.yaml (Trendyol* şemaları)
 * Trendyol tarih alanları epoch (ms) olarak döner.
 */
import { MarketplacePagedResponse } from './marketplace.models';

// ══════════════════════════════════════
//  SİPARİŞLER
// ══════════════════════════════════════

export interface TrendyolOrderQuery {
    orderNumber?: string | null;
    packageNumber?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    size?: number;
}

export interface TrendyolAddress {
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    company?: string | null;
    fullAddress?: string | null;
    city?: string | null;
    district?: string | null;
    neighborhood?: string | null;
    postalCode?: string | null;
    countryCode?: string | null;
    phone?: string | null;
    taxOffice?: string | null;
    taxNumber?: string | null;
}

export interface TrendyolOrderLine {
    lineId?: number | null;
    quantity?: number | null;
    productName?: string | null;
    productSize?: string | null;
    productColor?: string | null;
    stockCode?: string | null;
    barcode?: string | null;
    lineGrossAmount?: number | null;
    lineTotalDiscount?: number | null;
    lineUnitPrice?: number | null;
    vatRate?: number | null;
    currencyCode?: string | null;
    orderLineItemStatusName?: string | null;
    cancelReason?: string | null;
}

export interface TrendyolPackageHistory {
    createdDate?: number | null;
    status?: string | null;
}

export interface TrendyolOrder {
    shipmentPackageId?: number | null;
    orderNumber?: string | null;
    orderDate?: number | null;
    status?: string | null;
    shipmentPackageStatus?: string | null;
    paymentMethod?: string | null;
    packageGrossAmount?: number | null;
    packageTotalDiscount?: number | null;
    packageTotalPrice?: number | null;
    currencyCode?: string | null;
    customerFirstName?: string | null;
    customerLastName?: string | null;
    customerEmail?: string | null;
    cargoTrackingNumber?: string | number | null;
    cargoTrackingLink?: string | null;
    cargoProviderName?: string | null;
    agreedDeliveryDate?: number | null;
    lastModifiedDate?: number | null;
    fastDelivery?: boolean | null;
    invoiceLink?: string | null;
    invoiceNumber?: string | null;
    shipmentAddress?: TrendyolAddress | null;
    invoiceAddress?: TrendyolAddress | null;
    lines?: TrendyolOrderLine[] | null;
    packageHistories?: TrendyolPackageHistory[] | null;
}

export type TrendyolOrderResponse = MarketplacePagedResponse<TrendyolOrder>;

// ══════════════════════════════════════
//  ÜRÜNLER (STOK / FİYAT)
// ══════════════════════════════════════

export interface TrendyolProductInventoryQuery {
    barcode?: string | null;
    barcodes?: string | null;
    productCode?: string | null;
    stockCode?: string | null;
    contentId?: string | null;
    status?: string | null;
    orderByDirection?: string | null;
    nextPageToken?: string | null;
    page?: number;
    size?: number;
}

export interface TrendyolProductVariantInventory {
    variantId?: number | null;
    barcode?: string | null;
    salePrice?: number | null;
    listPrice?: number | null;
    quantity?: number | null;
    stockCode?: string | null;
    stockLastModifiedDate?: number | null;
}

export interface TrendyolProductInventory {
    contentId?: number | null;
    productMainId?: string | null;
    variants?: TrendyolProductVariantInventory[] | null;
}

export interface TrendyolProductInventoryResponse extends MarketplacePagedResponse<TrendyolProductInventory> {
    nextPageToken?: string | null;
}

// ══════════════════════════════════════
//  İADELER
// ══════════════════════════════════════

export interface TrendyolClaimQuery {
    claimIds?: string | null;
    claimItemStatus?: string | null;
    orderNumber?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    page?: number;
    size?: number;
}

export interface TrendyolClaimReason {
    id?: string | null;
    name?: string | null;
    code?: string | null;
}

export interface TrendyolClaimItem {
    id?: string | null;
    orderLineItemId?: number | null;
    customerClaimItemReason?: TrendyolClaimReason | null;
    trendyolClaimItemReason?: TrendyolClaimReason | null;
    claimItemStatus?: { name?: string | null } | null;
    note?: string | null;
    customerNote?: string | null;
    resolved?: boolean | null;
    autoAccepted?: boolean | null;
    acceptedBySeller?: boolean | null;
}

export interface TrendyolClaimOrderLine {
    productName?: string | null;
    barcode?: string | null;
    merchantSku?: string | null;
    productColor?: string | null;
    productSize?: string | null;
    price?: number | null;
}

export interface TrendyolClaimItemGroup {
    orderLine?: TrendyolClaimOrderLine | null;
    claimItems?: TrendyolClaimItem[] | null;
}

export interface TrendyolClaim {
    id?: string | null;
    claimId?: string | null;
    orderNumber?: string | null;
    orderDate?: number | null;
    claimDate?: number | null;
    lastModifiedDate?: number | null;
    customerFirstName?: string | null;
    customerLastName?: string | null;
    cargoTrackingNumber?: string | number | null;
    cargoTrackingLink?: string | null;
    cargoProviderName?: string | null;
    items?: TrendyolClaimItemGroup[] | null;
}

export type TrendyolClaimResponse = MarketplacePagedResponse<TrendyolClaim>;

export interface TrendyolApproveClaimItemsRequest {
    claimId: string;
    claimLineItemIds: string[];
}

// ══════════════════════════════════════
//  MÜŞTERİ SORULARI
// ══════════════════════════════════════

export interface TrendyolQuestionQuery {
    status?: string | null;
    barcode?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    orderByField?: string | null;
    orderByDirection?: string | null;
    page?: number;
    size?: number;
}

export interface TrendyolQuestionAnswer {
    id?: number | null;
    text?: string | null;
    creationDate?: number | null;
    hasPrivateInfo?: boolean | null;
    reason?: string | null;
}

export interface TrendyolQuestion {
    id?: number | null;
    text?: string | null;
    userName?: string | null;
    showUserName?: boolean | null;
    status?: string | null;
    creationDate?: number | null;
    public?: boolean | null;
    reason?: string | null;
    answeredDateMessage?: string | null;
    imageUrl?: string | null;
    productName?: string | null;
    productMainId?: string | null;
    webUrl?: string | null;
    answer?: TrendyolQuestionAnswer | null;
    rejectedAnswer?: TrendyolQuestionAnswer | null;
}

export type TrendyolQuestionResponse = MarketplacePagedResponse<TrendyolQuestion>;

export interface TrendyolAnswerQuestionRequest {
    questionId: number;
    text: string;
}

export interface TrendyolAnswerQuestionResponse {
    answerId?: number | null;
}

/** Trendyol müşteri taraması sorgusu */
export interface TrendyolCustomerQuery {
    customerId?: string | null;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    maxRequests?: number;
}

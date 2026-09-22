/**
 * ExtensionController → Beymen uç noktalarının istek modelleri.
 * Kaynak: src/assets/api/v1.yaml (Beymen* şemaları)
 *
 * Not: Beymen sipariş ve soru uç noktaları `MarketplaceToolResult` döner —
 * veri `dataJson` alanında şemasız (serbest) JSON metni olarak gelir.
 * Bu yüzden listelerin satır tipi `ToolRow` (Record<string, unknown>) olur.
 */

/** questionId şemada int64; JSON'da metin olarak da gelebilir */
export type BeymenQuestionId = number | string;

/** POST /api/Extension/beymen/orders */
export interface BeymenOrderQuery {
    orderNumber?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    shipmentStatus?: string | null;
    /** 0 tabanlı sayfa numarası (varsayılan 0) */
    page?: number;
    /** Sayfa boyutu (varsayılan 100) */
    size?: number;
}

/** POST /api/Extension/beymen/customer-questions */
export interface BeymenQuestionQuery {
    productName?: string | null;
    modelCode?: string | null;
    color?: string | null;
    brandName?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    /** 0 tabanlı sayfa numarası (varsayılan 0) */
    page?: number;
    /** Sayfa boyutu (varsayılan 10) */
    size?: number;
}

/** POST /api/Extension/beymen/customer-questions/answer */
export interface BeymenAnswerQuestionRequest {
    questionId?: BeymenQuestionId | null;
    answer?: string | null;
}

/** POST /api/Extension/beymen/customer-questions/report-issue */
export interface BeymenReportQuestionIssueRequest {
    questionId?: BeymenQuestionId | null;
    reportReason?: string | null;
}

/** POST /api/Extension/beymen/products */
export interface BeymenProductQuery {
    barcode?: string | null;
    modelCode?: string | null;
    stockCode?: string | null;
    status?: string | null;
    /** 0 tabanlı sayfa numarası (varsayılan 0) */
    page?: number;
    /** Sayfa boyutu (varsayılan 50) */
    size?: number;
}

/** POST /api/Extension/beymen/products/by-product-code */
export interface BeymenProductCodeQuery {
    productCode: string;
}

/** POST /api/Extension/beymen/products/by-barcode */
export interface BeymenProductBarcodeQuery {
    barcode: string;
}

export interface BeymenNamedValue {
    id?: string | null;
    name?: string | null;
    code?: string | null;
}

export interface BeymenPrice {
    value?: number | string | null;
    currency?: string | null;
}

export interface BeymenStock {
    count?: number | string | null;
}

export interface BeymenProductImage {
    id?: number | string | null;
    thumbnailPath?: string | null;
    originalPath?: string | null;
}

export interface BeymenCatalogProduct {
    id?: string | null;
    externalId?: string | null;
    merchantId?: string | null;
    name?: string | null;
    barcode?: string | null;
    modelCode?: string | null;
    stockCode?: string | null;
    description?: string | null;
    merchantColorCode?: string | null;
    brand?: BeymenNamedValue | null;
    category?: BeymenNamedValue | null;
    size?: BeymenNamedValue | null;
    gender?: BeymenNamedValue | null;
    platformColor?: BeymenNamedValue | null;
    salesPrice?: BeymenPrice | null;
    platformSalesPrice?: BeymenPrice | null;
    vatRate?: number | string | null;
    desi?: number | string | null;
    stock?: BeymenStock | null;
    status?: string | null;
    subStatus?: string | null;
    images?: BeymenProductImage[];
    version?: string | null;
}

/** POST /api/Extension/beymen/products yanıtı */
export interface BeymenProductListResponse {
    items?: BeymenCatalogProduct[];
    page?: number | string | null;
    itemsPerPage?: number | string | null;
    pageCount?: number | string | null;
    total?: number | string | null;
}

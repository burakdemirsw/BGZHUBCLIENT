/**
 * ExtensionController → Hepsiburada uç noktalarının request/response modelleri.
 * Kaynak: src/assets/api/v1.yaml (Hepsiburada* şemaları)
 * Hepsiburada tarih alanları ISO 8601 (date-time) metin olarak döner.
 */

// ══════════════════════════════════════
//  ORTAK
// ══════════════════════════════════════

export interface HepsiburadaMoney {
    currency?: string | null;
    amount?: number | null;
}

export interface HepsiburadaAddress {
    addressId?: string | null;
    address?: string | null;
    name?: string | null;
    email?: string | null;
    countryCode?: string | null;
    phoneNumber?: string | null;
    alternatePhoneNumber?: string | null;
    district?: string | null;
    city?: string | null;
    town?: string | null;
    directions?: string | null;
    postalCode?: string | null;
}

export interface HepsiburadaCargoCompany {
    id?: number | null;
    name?: string | null;
    shortName?: string | null;
    logoUrl?: string | null;
    trackingUrl?: string | null;
}

export interface HepsiburadaInvoice {
    turkishIdentityNumber?: string | null;
    taxNumber?: string | null;
    taxOffice?: string | null;
    address?: HepsiburadaAddress | null;
}

export interface HepsiburadaWarehouse {
    shippingModel?: string | null;
    shippingAddressLabel?: string | null;
}

export interface HepsiburadaProperty {
    name?: string | null;
    value?: string | null;
    displayName?: string | null;
}

// ══════════════════════════════════════
//  SİPARİŞLER (orders/list)
// ══════════════════════════════════════

export interface HepsiburadaOrderListQuery {
    startDate?: string | null;
    endDate?: string | null;
    /** 0 tabanlı kayıt offseti (sayfa numarası değil) */
    offset?: number;
    limit?: number;
}

export interface HepsiburadaOrderItem {
    id?: string | null;
    name?: string | null;
    sku?: string | null;
    merchantSKU?: string | null;
    productBarcode?: string | null;
    barcode?: string | null;
    packageNumber?: string | null;
    orderId?: string | null;
    orderNumber?: string | null;
    orderDate?: string | null;
    dueDate?: string | null;
    lastStatusUpdateDate?: string | null;
    quantity?: number | null;
    status?: string | null;
    merchantId?: string | null;
    customerId?: string | null;
    customerName?: string | null;
    totalPrice?: HepsiburadaMoney | null;
    unitPrice?: HepsiburadaMoney | null;
    purchasePrice?: HepsiburadaMoney | null;
    hbDiscount?: HepsiburadaMoney | null;
    merchantDiscount?: HepsiburadaMoney | null;
    commission?: HepsiburadaMoney | null;
    commissionRate?: number | null;
    vat?: number | null;
    vatRate?: number | null;
    cargoCompany?: string | null;
    cargoCompanyModel?: HepsiburadaCargoCompany | null;
    deliveryType?: string | null;
    shippingAddress?: HepsiburadaAddress | null;
    invoice?: HepsiburadaInvoice | null;
    warehouse?: HepsiburadaWarehouse | null;
    properties?: HepsiburadaProperty[] | null;
    isCancellable?: boolean | null;
    canCreatePackage?: boolean | null;
    isCargoChangable?: boolean | null;
    isMicroExport?: boolean | null;
}

export interface HepsiburadaOrderPageResponse {
    totalCount?: number | null;
    limit?: number | null;
    offset?: number | null;
    pageCount?: number | null;
    items?: HepsiburadaOrderItem[] | null;
}

// ══════════════════════════════════════
//  ÜRÜNLER (products — katalog)
// ══════════════════════════════════════

export interface HepsiburadaProductQuery {
    barcode?: string | null;
    merchantSku?: string | null;
    hepsiburadaSku?: string | null;
    /** 0 tabanlı sayfa numarası */
    page?: number;
    size?: number;
}

export interface HepsiburadaCatalogProduct {
    merchantSku?: string | null;
    barcode?: string | null;
    hbSku?: string | null;
    variantGroupId?: string | null;
    productName?: string | null;
    brand?: string | null;
    categoryId?: number | null;
    categoryName?: string | null;
    price?: number | null;
    tax?: number | null;
    status?: string | null;
    images?: string[] | null;
}

export interface HepsiburadaCatalogProductResponse {
    totalElements?: number | null;
    totalPages?: number | null;
    number?: number | null;
    numberOfElements?: number | null;
    data?: HepsiburadaCatalogProduct[] | null;
}

// ══════════════════════════════════════
//  İLANLAR (listings)
// ══════════════════════════════════════

export interface HepsiburadaListingQuery {
    merchantSkus?: string[] | null;
    hepsiburadaSkus?: string[] | null;
    /** 0 tabanlı kayıt offseti */
    offset?: number;
    limit?: number;
}

export interface HepsiburadaListing {
    uniqueIdentifier?: string | null;
    hepsiburadaSku?: string | null;
    merchantSku?: string | null;
    price?: number | null;
    availableStock?: number | null;
    dispatchTime?: number | null;
    maximumPurchasableQuantity?: number | null;
    isSalable?: boolean | null;
    isLocked?: boolean | null;
    isSuspended?: boolean | null;
    isFrozen?: boolean | null;
}

export interface HepsiburadaListingResponse {
    totalCount?: number | null;
    offset?: number | null;
    limit?: number | null;
    listings?: HepsiburadaListing[] | null;
}

// ══════════════════════════════════════
//  SORULAR (customer-questions)
// ══════════════════════════════════════

export interface HepsiburadaQuestionQuery {
    source?: number | null;
    subject?: string | null;
    minCreatedAt?: string | null;
    maxCreatedAt?: string | null;
    minModifiedAt?: string | null;
    maxModifiedAt?: string | null;
    issueNumber?: number | null;
    status?: string | null;
    search?: string | null;
    sortBy?: string | null;
    /** Varsayılan: true */
    desc?: boolean;
    /** 1 tabanlı sayfa numarası (varsayılan: 1) */
    page?: number;
    size?: number;
}

export interface HepsiburadaAnswerAttachment {
    fileName?: string | null;
    contentBase64?: string | null;
    contentType?: string | null;
}

export interface HepsiburadaAnswerQuestionRequest {
    issueNumber?: number | null;
    answer?: string | null;
    files?: HepsiburadaAnswerAttachment[] | null;
}

// ══════════════════════════════════════
//  MÜŞTERİLER (customers)
// ══════════════════════════════════════

/** Ortak MarketplaceCustomerQuery ile aynı alanlara sahiptir */
export interface HepsiburadaCustomerQuery {
    customerId?: string | null;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    maxRequests?: number;
}

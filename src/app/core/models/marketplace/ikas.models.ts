/**
 * ExtensionController → ikas uç noktalarının request/response modelleri.
 * Kaynak: src/assets/api/v1.yaml (Ikas* şemaları)
 * ikas tarih alanları epoch (ms) olarak döner.
 *
 * NOT: `status`, `orderPaymentStatus`, `shippingMethod`, `orderPackageFulfillStatus`,
 * `orderLineItems[].status` ve `paymentMethods[].type` alanları yaml'da integer enum
 * olarak tanımlı; değer karşılıkları bilinmediği için UI'de gösterilmez.
 */

// ══════════════════════════════════════
//  SİPARİŞLER
// ══════════════════════════════════════

export interface IkasOrderQuery {
    orderNumber?: string | null;
    customerEmail?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    /** 1 tabanlı sayfa numarası (varsayılan 1) */
    page?: number;
    /** Sayfa başına kayıt (varsayılan 50) */
    limit?: number;
    orderPackageStatuses?: string[] | null;
    orderPaymentStatuses?: string[] | null;
}

/** Şehir / ilçe / ülke gibi adres referansları */
export interface IkasOrderAddressRef {
    id?: string | null;
    code?: string | null;
    name?: string | null;
    iso2?: string | null;
    iso3?: string | null;
}

export interface IkasOrderAddress {
    id?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: IkasOrderAddressRef | null;
    company?: string | null;
    country?: IkasOrderAddressRef | null;
    district?: IkasOrderAddressRef | null;
    firstName?: string | null;
    identityNumber?: string | null;
    isDefault?: boolean | null;
    lastName?: string | null;
    phone?: string | null;
    postalCode?: string | null;
    region?: IkasOrderAddressRef | null;
    state?: IkasOrderAddressRef | null;
    taxNumber?: string | null;
    taxOffice?: string | null;
}

export interface IkasOrderCustomer {
    id?: string | null;
    email?: string | null;
    firstName?: string | null;
    fullName?: string | null;
    isGuestCheckout?: boolean | null;
    lastName?: string | null;
    notificationsAccepted?: boolean | null;
    phone?: string | null;
    preferredLanguage?: string | null;
}

export interface IkasOrderVariant {
    id?: string | null;
    name?: string | null;
    sku?: string | null;
    barcodeList?: string[] | null;
}

export interface IkasOrderLineItem {
    id?: string | null;
    quantity?: number | null;
    price?: number | null;
    finalPrice?: number | null;
    /** integer enum — UI'de gösterilmez */
    status?: number | null;
    variant?: IkasOrderVariant | null;
}

export interface IkasTrackingInfoDetail {
    barcode?: string | null;
    cargoCompany?: string | null;
    cargoCompanyId?: string | null;
    isSendNotification?: boolean | null;
    trackingLink?: string | null;
    trackingNumber?: string | null;
    shippingLabelImage?: string | null;
}

export interface IkasOrderPackage {
    id?: string | null;
    errorMessage?: string | null;
    note?: string | null;
    orderLineItemIds?: string[] | null;
    /** integer enum — UI'de gösterilmez */
    orderPackageFulfillStatus?: number | null;
    orderPackageNumber?: string | null;
    sourceId?: string | null;
    stockLocationId?: string | null;
    trackingInfo?: IkasTrackingInfoDetail | null;
}

export interface IkasOrderShippingLine {
    finalPrice?: number | null;
    isRefunded?: boolean | null;
    /** integer enum — UI'de gösterilmez */
    paymentMethod?: number | null;
    price?: number | null;
    priceListId?: string | null;
    shippingSettingsId?: string | null;
    shippingZoneRateId?: string | null;
    taxValue?: number | null;
    title?: string | null;
    transactionId?: string | null;
}

export interface IkasOrderPaymentMethod {
    paymentGatewayCode?: string | null;
    paymentGatewayId?: string | null;
    paymentGatewayName?: string | null;
    price?: number | null;
    /** integer enum — UI'de gösterilmez */
    type?: number | null;
}

export interface IkasOrderSalesChannel {
    id?: string | null;
    name?: string | null;
}

export interface IkasOrder {
    id?: string | null;
    orderNumber?: string | null;
    /** integer enum — UI'de gösterilmez */
    status?: number | null;
    cancelReason?: string | null;
    cancelledAt?: number | null;
    createdAt?: number | null;
    orderedAt?: number | null;
    dueDate?: number | null;
    currencyCode?: string | null;
    customerId?: string | null;
    customerOrderCount?: number | null;
    /** Metin durum — UI'de gösterilir */
    orderPackageStatus?: string | null;
    /** integer enum — UI'de gösterilmez */
    orderPaymentStatus?: number | null;
    totalFinalPrice?: number | null;
    totalPrice?: number | null;
    salesChannel?: IkasOrderSalesChannel | null;
    /** integer enum — UI'de gösterilmez */
    shippingMethod?: number | null;
    note?: string | null;
    isGiftPackage?: boolean | null;
    giftPackageNote?: string | null;
    shippingLines?: IkasOrderShippingLine[] | null;
    billingAddress?: IkasOrderAddress | null;
    shippingAddress?: IkasOrderAddress | null;
    orderPackages?: IkasOrderPackage[] | null;
    customer?: IkasOrderCustomer | null;
    orderLineItems?: IkasOrderLineItem[] | null;
    paymentMethods?: IkasOrderPaymentMethod[] | null;
    orderTagIds?: string[] | null;
}

export interface IkasOrderPage {
    orders?: IkasOrder[] | null;
    hasNext?: boolean | null;
    page?: number | null;
    limit?: number | null;
    totalCount?: number | null;
}

// ══════════════════════════════════════
//  ÜRÜNLER
// ══════════════════════════════════════

export interface IkasProductQuery {
    search?: string | null;
    sku?: string | null;
    barcode?: string | null;
    productId?: string | null;
    /** 1 tabanlı sayfa numarası (varsayılan 1) */
    page?: number;
    /** Sayfa başına kayıt (varsayılan 20) */
    limit?: number;
}

export interface IkasStockResponse {
    stockLocationId?: string | null;
    stockLocationName?: string | null;
    stockCount?: number | null;
}

export interface IkasVariantValueResponse {
    name?: string | null;
    value?: string | null;
}

export interface IkasVariantResponse {
    id?: string | null;
    sku?: string | null;
    barcodes?: string[] | null;
    isActive?: boolean | null;
    sellIfOutOfStock?: boolean | null;
    sellPrice?: number | null;
    discountPrice?: number | null;
    buyPrice?: number | null;
    currency?: string | null;
    totalStock?: number | null;
    variantValues?: IkasVariantValueResponse[] | null;
    stocks?: IkasStockResponse[] | null;
    imageIds?: string[] | null;
}

export interface IkasProductDetailResponse {
    id?: string | null;
    name?: string | null;
    type?: string | null;
    brand?: string | null;
    categories?: string[] | null;
    tags?: string[] | null;
    totalStock?: number | null;
    variants?: IkasVariantResponse[] | null;
}

// ══════════════════════════════════════
//  STOKLAR
// ══════════════════════════════════════

export interface IkasStockQuery {
    /** Stok kodu / barkod listesi */
    codes?: string[] | null;
    stockLocationId?: string | null;
    maxStockCount?: number | null;
    /** Sayfa başına kayıt (varsayılan 50) */
    limit?: number;
}

export interface IkasVariantStockResponse {
    productId?: string | null;
    productName?: string | null;
    variantId?: string | null;
    sku?: string | null;
    barcodes?: string[] | null;
    variantName?: string | null;
    isActive?: boolean | null;
    sellIfOutOfStock?: boolean | null;
    totalStock?: number | null;
    stocks?: IkasStockResponse[] | null;
}

export interface IkasStockLocationResponse {
    id?: string | null;
    name?: string | null;
    type?: string | null;
}

// ══════════════════════════════════════
//  MÜŞTERİLER
// ══════════════════════════════════════

export interface IkasCustomerQuery {
    customerId?: string | null;
    email?: string | null;
    phone?: string | null;
    search?: string | null;
    /** 1 tabanlı sayfa numarası (varsayılan 1) */
    page?: number;
    /** Sayfa başına kayıt (varsayılan 20) */
    limit?: number;
}

export interface IkasCustomerAddress {
    id?: string | null;
    title?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    postalCode?: string | null;
    company?: string | null;
    identityNumber?: string | null;
    taxNumber?: string | null;
    taxOffice?: string | null;
    isDefault?: boolean | null;
    city?: IkasOrderAddressRef | null;
    district?: IkasOrderAddressRef | null;
    country?: IkasOrderAddressRef | null;
    state?: IkasOrderAddressRef | null;
    region?: IkasOrderAddressRef | null;
}

export interface IkasCustomer {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
    accountStatus?: string | null;
    subscriptionStatus?: string | null;
    orderCount?: number | null;
    totalOrderPrice?: number | null;
    isEmailVerified?: boolean | null;
    isPhoneVerified?: boolean | null;
    createdAt?: number | null;
    updatedAt?: number | null;
    firstOrderDate?: number | null;
    lastOrderDate?: number | null;
    tagIds?: string[] | null;
    customerGroupIds?: string[] | null;
    addresses?: IkasCustomerAddress[] | null;
}

export interface IkasCustomerPage {
    customers?: IkasCustomer[] | null;
    hasNext?: boolean | null;
    page?: number | null;
    limit?: number | null;
    totalCount?: number | null;
}

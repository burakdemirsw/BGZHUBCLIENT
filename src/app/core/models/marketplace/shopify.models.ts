/**
 * ExtensionController → Shopify uç noktalarının request/response modelleri.
 * Kaynak: src/assets/api/v1.yaml (Shopify* şemaları)
 * Shopify imleç (cursor) tabanlı sayfalar: istekte `after`, yanıtta `endCursor` + `hasNextPage`.
 * Para alanları string olarak döner (ShopifyMoney.amount).
 */

export interface ShopifyMoney {
    amount?: string | null;
    currencyCode?: string | null;
}

export interface ShopifyMoneyBag {
    shopMoney?: ShopifyMoney | null;
}

export interface ShopifyAddress {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    address1?: string | null;
    address2?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    countryCodeV2?: string | null;
    zip?: string | null;
    phone?: string | null;
}

export interface ShopifyCustomerEmailAddress {
    emailAddress?: string | null;
    marketingState?: string | null;
}

export interface ShopifyCustomerPhoneNumber {
    phoneNumber?: string | null;
    marketingState?: string | null;
}

// ══════════════════════════════════════
//  SİPARİŞLER
// ══════════════════════════════════════

export interface ShopifyOrderListQuery {
    startDate?: string | null;
    endDate?: string | null;
    financialStatus?: string | null;
    fulfillmentStatus?: string | null;
    search?: string | null;
    limit?: number;
    after?: string | null;
}

export interface ShopifyOrderQuery {
    orderId?: string | null;
    limit?: number;
}

export interface ShopifyCustomer {
    id?: string | null;
    displayName?: string | null;
    defaultEmailAddress?: ShopifyCustomerEmailAddress | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
}

export interface ShopifyVariant {
    id?: string | null;
    title?: string | null;
    sku?: string | null;
    barcode?: string | null;
}

export interface ShopifyLineItem {
    id?: string | null;
    title?: string | null;
    name?: string | null;
    variantTitle?: string | null;
    quantity?: number | null;
    sku?: string | null;
    originalUnitPriceSet?: ShopifyMoneyBag | null;
    discountedUnitPriceSet?: ShopifyMoneyBag | null;
    variant?: ShopifyVariant | null;
}

export interface ShopifyLineItemEdge {
    node?: ShopifyLineItem | null;
}

export interface ShopifyLineItemConnection {
    edges?: ShopifyLineItemEdge[] | null;
}

export interface ShopifyTrackingInfo {
    number?: string | null;
    url?: string | null;
    company?: string | null;
}

export interface ShopifyFulfillment {
    id?: string | null;
    status?: string | null;
    createdAt?: string | null;
    trackingInfo?: ShopifyTrackingInfo[] | null;
}

export interface ShopifyOrder {
    id?: string | null;
    name?: string | null;
    number?: number | null;
    createdAt?: string | null;
    processedAt?: string | null;
    updatedAt?: string | null;
    cancelledAt?: string | null;
    closedAt?: string | null;
    displayFinancialStatus?: string | null;
    displayFulfillmentStatus?: string | null;
    email?: string | null;
    phone?: string | null;
    note?: string | null;
    tags?: string[] | null;
    currencyCode?: string | null;
    totalPriceSet?: ShopifyMoneyBag | null;
    subtotalPriceSet?: ShopifyMoneyBag | null;
    totalTaxSet?: ShopifyMoneyBag | null;
    totalDiscountsSet?: ShopifyMoneyBag | null;
    totalShippingPriceSet?: ShopifyMoneyBag | null;
    customer?: ShopifyCustomer | null;
    shippingAddress?: ShopifyAddress | null;
    billingAddress?: ShopifyAddress | null;
    lineItems?: ShopifyLineItemConnection | null;
    fulfillments?: ShopifyFulfillment[] | null;
}

export interface ShopifyOrderPage {
    orders?: ShopifyOrder[] | null;
    hasNextPage?: boolean | null;
    endCursor?: string | null;
}

// ══════════════════════════════════════
//  ÜRÜNLER
// ══════════════════════════════════════

export interface ShopifyProductQuery {
    search?: string | null;
    limit?: number;
    after?: string | null;
}

export interface ShopifyPriceRange {
    minVariantPrice?: ShopifyMoney | null;
    maxVariantPrice?: ShopifyMoney | null;
}

export interface ShopifyLocation {
    id?: string | null;
    name?: string | null;
}

export interface ShopifyInventoryQuantity {
    name?: string | null;
    quantity?: number | null;
}

export interface ShopifyInventoryLevel {
    location?: ShopifyLocation | null;
    quantities?: ShopifyInventoryQuantity[] | null;
}

export interface ShopifyInventoryItem {
    id?: string | null;
    tracked?: boolean | null;
    inventoryLevels?: { nodes?: ShopifyInventoryLevel[] | null } | null;
}

export interface ShopifyVariantProduct {
    id?: string | null;
    title?: string | null;
    handle?: string | null;
}

export interface ShopifyProductVariant {
    id?: string | null;
    title?: string | null;
    displayName?: string | null;
    sku?: string | null;
    barcode?: string | null;
    price?: string | null;
    inventoryQuantity?: number | null;
    product?: ShopifyVariantProduct | null;
    inventoryItem?: ShopifyInventoryItem | null;
}

export interface ShopifyProduct {
    id?: string | null;
    title?: string | null;
    handle?: string | null;
    status?: string | null;
    vendor?: string | null;
    productType?: string | null;
    tags?: string[] | null;
    totalInventory?: number | null;
    onlineStoreUrl?: string | null;
    priceRangeV2?: ShopifyPriceRange | null;
    variants?: { nodes?: ShopifyProductVariant[] | null } | null;
}

export interface ShopifyProductPage {
    items?: ShopifyProduct[] | null;
    hasNextPage?: boolean | null;
    endCursor?: string | null;
}

// ══════════════════════════════════════
//  STOK
// ══════════════════════════════════════

export interface ShopifyStockQuery {
    barcode?: string | null;
    productCode?: string | null;
    limit?: number;
    hasFilter?: boolean;
}

export interface ShopifyLocationStockResponse {
    locationId?: string | null;
    locationName?: string | null;
    available?: number | null;
    onHand?: number | null;
    committed?: number | null;
    incoming?: number | null;
}

export interface ShopifyStockResponse {
    variantId?: string | null;
    productId?: string | null;
    productTitle?: string | null;
    variantTitle?: string | null;
    productCode?: string | null;
    barcode?: string | null;
    price?: string | null;
    isTracked?: boolean | null;
    totalAvailable?: number | null;
    matchType?: string | null;
    locations?: ShopifyLocationStockResponse[] | null;
}

// ══════════════════════════════════════
//  MÜŞTERİLER
// ══════════════════════════════════════

export interface ShopifyCustomerQuery {
    customerId?: string | null;
    email?: string | null;
    phone?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    search?: string | null;
    limit?: number;
    after?: string | null;
}

export interface ShopifyCustomerLastOrder {
    id?: string | null;
    name?: string | null;
    createdAt?: string | null;
}

export interface ShopifyCustomerDetail {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    defaultEmailAddress?: ShopifyCustomerEmailAddress | null;
    defaultPhoneNumber?: ShopifyCustomerPhoneNumber | null;
    numberOfOrders?: string | null;
    amountSpent?: ShopifyMoney | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    note?: string | null;
    tags?: string[] | null;
    state?: string | null;
    verifiedEmail?: boolean | null;
    locale?: string | null;
    defaultAddress?: ShopifyAddress | null;
    lastOrder?: ShopifyCustomerLastOrder | null;
}

export interface ShopifyCustomerPage {
    customers?: ShopifyCustomerDetail[] | null;
    hasNextPage?: boolean | null;
    endCursor?: string | null;
}

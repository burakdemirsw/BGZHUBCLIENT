/**
 * ExtensionController pazaryeri uç noktalarının ortak modelleri.
 * Kaynak: src/assets/api/v1.yaml
 */

/** Tüm Extension istekleri bu zarf ile gönderilir */
export interface ExtensionRequest<T> {
    companyId: string;
    payload: T;
}

/** Trendyol/Boyner listeleme yanıtlarının ortak sayfalama zarfı */
export interface MarketplacePagedResponse<T> {
    page?: number | null;
    size?: number | null;
    totalPages?: number | null;
    totalElements?: number | null;
    content?: T[] | null;
}

/**
 * Tipli karşılığı olmayan uç noktaların (Beymen siparişleri/soruları,
 * Hepsiburada soruları) yanıtı — veri `dataJson` içinde serbest JSON olarak gelir.
 */
export interface MarketplaceToolResult {
    success: boolean;
    provider?: string | null;
    toolName?: string | null;
    dataJson?: string | null;
    rowCount?: number | null;
    errorMessage?: string | null;
}

// ══════════════════════════════════════
//  MÜŞTERİLER (Trendyol / Hepsiburada / Boyner / Beymen ortak)
// ══════════════════════════════════════

export interface MarketplaceCustomerAddress {
    fullName?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
    phone?: string | null;
}

export interface MarketplaceCustomerProfile {
    customerId?: string | null;
    fullName?: string | null;
    email?: string | null;
    phone?: string | null;
    orderCount?: number | null;
    totalAmount?: number | null;
    currencyCode?: string | null;
    firstOrderDate?: string | null;
    lastOrderDate?: string | null;
    orderNumbers?: string[] | null;
    lastAddress?: MarketplaceCustomerAddress | null;
}

export interface MarketplaceCustomerResponse {
    provider?: string | null;
    customers?: MarketplaceCustomerProfile[] | null;
    startDate?: string | null;
    endDate?: string | null;
    scannedOrderCount?: number | null;
    requestCount?: number | null;
    isTruncated?: boolean | null;
}

/** Müşteri uç noktalarının ortak sorgusu (sipariş taramasına dayanır) */
export interface MarketplaceCustomerQuery {
    customerId?: string | null;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    maxRequests?: number;
}

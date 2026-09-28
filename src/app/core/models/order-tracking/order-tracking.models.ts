/**
 * Sipariş Takip (public) modelleri.
 * Kaynak: v1 (46).yaml — OrderTracking controller (`/order-tracking/...`).
 * Dikkat: bu uçlar `/api` öneki olmadan sunucu kökünde yayınlanır.
 */

/** URL'den gelen bağlam: /order-tracking/:companyId/:extensionId/:orderNo */
export interface OrderTrackingContext {
    companyId: string;
    extensionId: string;
    orderNo: string;
}

/** GET /order-tracking/brand/{companyId}/{extensionId} */
export interface OrderTrackingBrandResponse {
    companyId: string;
    brandName: string;
    logoUrl: string | null;
    /** SMS gönderiminde kullanılan eklenti kodu */
    smsExtensionCode: string | null;
}

/** Sipariş satırı — `options` beden/renk gibi varyant metinlerini taşır */
export interface OrderTrackingItemResponse {
    lineId: number | string;
    productName: string | null;
    stockCode: string | null;
    barcode: string | null;
    quantity: number | string;
    unitPrice: number | string;
    totalAmount: number | string;
    imageUrl: string | null;
    statusCode: number | string;
    statusName: string | null;
    options: string[];
}

/**
 * GET /order-tracking/{companyId}/{extensionId}/{orderNo}
 * POST /order-tracking/{companyId}/{extensionId}/{orderNo}/verify
 */
export interface OrderTrackingResponse {
    orderNumber: string;
    /** API maskelenmiş ad döner */
    customerName: string | null;
    orderDate: string | null;
    statusCode: number | string;
    statusName: string | null;
    cargoCompanyName: string | null;
    cargoTrackingNumber: string | null;
    cargoTrackingLink: string | null;
    canRequestReturn: boolean;
    items: OrderTrackingItemResponse[];
}

/** POST /order-tracking/{companyId}/{extensionId}/{orderNo}/verification-code */
export interface OrderTrackingVerificationResponse {
    orderNumber: string;
    maskedPhone: string | null;
    expireDate: string;
    /** Kodun kalan geçerlilik süresi */
    remainingSeconds: number | string;
}

/** POST .../verify gövdesi — `key` kullanıcının girdiği doğrulama kodu */
export interface VerifyOrderTrackingRequest {
    key: string;
}

/** GET /order-tracking/{companyId}/return-reasons */
export interface ReturnReasonOptionResponse {
    returnCode: string;
    returnReasonDescription: string;
    sortOrder: number | string;
}

/** GET /order-tracking/{companyId}/after-return-actions */
export interface AfterReturnActionOptionResponse {
    actionCode: string;
    actionDescription: string;
    sortOrder: number | string;
}

/** GET /order-tracking/{companyId}/before-claim-instructions */
export interface BeforeClaimInstructionOptionResponse {
    sortOrder: number | string;
    content: string;
}

// ─────────────────────────────────────────────────────────────
// Aşağıdaki tiplerin OrderTracking controller'ında karşılığı YOK.
// İade talebinin son adımı için gerekli; uçlar açılınca güncellenmeli.
// ─────────────────────────────────────────────────────────────

/** İade paketinin gönderileceği kargo şirketi seçeneği */
export interface CargoCompanyOption {
    code: string;
    name: string;
    logoUrl?: string | null;
    /** Kargo şubesinde gösterilecek cari bilgi */
    customerNo?: string | null;
    accountTitle?: string | null;
}

export interface CreateReturnClaimItemRequest {
    lineId: number | string;
    quantity: number;
    returnCode: string;
}

export interface CreateReturnClaimRequest {
    companyId: string;
    extensionId: string;
    orderNo: string;
    items: CreateReturnClaimItemRequest[];
    actionCode: string;
    cargoCompanyCode: string;
    note?: string;
}

export interface CreateReturnClaimResponse {
    returnCode: string;
    cargoCompanyName: string;
    cargoCustomerNo: string;
    cargoAccountTitle: string;
    /** Kodun son geçerlilik tarihi */
    validUntil: string;
}

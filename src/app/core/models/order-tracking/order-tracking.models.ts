/**
 * Sipariş Takip (public) modelleri.
 * Kaynak: v1 (52).yaml — OrderTracking controller (`/order-tracking/...`).
 * Dikkat: bu uçlar `/api` öneki olmadan sunucu kökünde yayınlanır.
 */

/**
 * URL'den gelen bağlam: /order-tracking/:companyId/:extensionId
 * `orderNo` route'tan değil, sorgulama ekranında kullanıcıdan alınır.
 */
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

/** GET /order-tracking/{companyId}/{extensionId}/{orderNo} — doğrulama öncesi özet */
export interface OrderTrackingSummaryResponse {
    orderNumber: string;
    /** API maskelenmiş ad döner */
    customerName: string | null;
    orderDate: string | null;
    statusName: string | null;
    cargoCompanyName: string | null;
    cargoTrackingNumber: string | null;
    canRequestReturn: boolean;
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
 * Teslimat adresi. Doğrulama öncesi özet ekranında maskeli, doğrulama sonrası
 * sipariş detayında açık gelir — panel gelen değeri olduğu gibi gösterir.
 */
export interface OrderTrackingAddressResponse {
    recipientName: string | null;
    maskedPhone: string | null;
    city: string | null;
    district: string | null;
    town: string | null;
}

/**
 * Siparişin ödeme tipi — iade tutarının nereye döneceğini belirler.
 * `CCPayment` karta iade, `BankPayment` banka hesabına iade (IBAN gerekir),
 * `GiftCodePayment` hediye çeki / puan. Tanımsız ödeme tipinde API `null` döner.
 */
export type OrderTrackingPaymentTypeCode = 'CCPayment' | 'BankPayment' | 'GiftCodePayment';

/**
 * GET  /order-tracking/{companyId}/{extensionId}/{orderNo}/detail
 * POST /order-tracking/{companyId}/{extensionId}/{orderNo}/verify
 */
export interface OrderTrackingDetailResponse {
    orderNumber: string;
    /** Doğrulama sonrası açık ad — panelde maskelenmez */
    customerName: string | null;
    orderDate: string | null;
    statusCode: number | string;
    statusName: string | null;
    cargoCompanyName: string | null;
    cargoTrackingNumber: string | null;
    cargoTrackingLink: string | null;
    canRequestReturn: boolean;
    totalAmount: number | string;
    totalVat: number | string;
    cargoAmount: number | string;
    paymentTypeCode: OrderTrackingPaymentTypeCode | null;
    paymentTypeName: string | null;
    /** Sağlayıcının (Ticimax) sayısal ödeme tipi kodu */
    providerPaymentTypeCode: number | string | null;
    /** Fatura bilgileri — fatura kesilmediyse üçü de null gelir */
    invoiceNumber: string | null;
    invoiceDate: string | null;
    /** Faturanın (varsa e-fatura) görüntüleme adresi */
    invoiceUrl: string | null;
    orderNote: string | null;
    deliveryAddress: OrderTrackingAddressResponse | null;
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

/** GET /order-tracking/after-return-actions — seçenekler tüm şirketlerde ortak */
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

/** GET /order-tracking/{companyId}/cargo-companies */
export interface CargoCompanyResponse {
    /** İade talebinde gönderilecek kargo entegrasyonu kimliği */
    cargoExtensionId: string;
    code: string;
    name: string;
    /** Kargo şubesinde gösterilecek anlaşmalı müşteri numarası */
    customerNo: string | null;
    accountTitle: string | null;
}

/** POST .../return-claim gövdesindeki iade satırı */
export interface CreateReturnClaimLineRequest {
    quantity: number;
    returnReasonCode?: string | null;
    sourceItemCode?: string | null;
    /** Sağlayıcıdaki ürün görseli */
    sourceImageUrl?: string | null;
    itemCode?: string | null;
    colorCode?: string | null;
    usedBarcode?: string | null;
    orderLineId?: string | null;
    /** Pazaryeri sipariş satırı kimliği */
    externalClaimLineId?: string | null;
    customerNote?: string | null;
}

/** POST /order-tracking/{companyId}/{extensionId}/{orderNo}/return-claim */
export interface CreateReturnClaimRequest {
    items: CreateReturnClaimLineRequest[];
    returnReasonCode?: string | null;
    afterReturnActionCode?: string | null;
    /** Seçilen kargo şirketinin entegrasyon kimliği */
    cargoExtensionId?: string | null;
    customerNote?: string | null;
    /** Para iadesi için müşterinin IBAN'ı — en fazla 34 karakter */
    iban?: string | null;
    /** Hesap sahibinin adı / ünvanı — en fazla 200 karakter */
    ibanAccountDescription?: string | null;
    /** Müşterinin talepte belirttiği ad / ünvan — en fazla 200 karakter */
    customerDescription?: string | null;
}

/** Kargo entegrasyonunda oluşan iade gönderisi — WmsReturnClaimCargoResponse */
export interface ReturnClaimCargoResponse {
    id: string;
    claimNumber: string;
    orderNumber: string;
    cargoCompanyName: string;
    cargoCustomerNo: string | null;
    /** Kargo kaydı gerçekten oluşturulabildi mi? */
    isCargoCreated: boolean;
    /** Şubede gösterilecek kargo referans numarası — oluşmadıysa null */
    cargoReferenceId: string | null;
    createdDate: string;
}

/** Kargo kaydı ve yazdırılacak ZPL etiketleri */
export interface ReturnClaimCargoResultResponse {
    cargo: ReturnClaimCargoResponse;
    zplLabels: string[];
}

/** İade talebi sonucu — kargo şubesinde gösterilecek bilgiler */
export interface ReturnClaimResultResponse {
    returnCode: string;
    cargoCompanyName: string | null;
    cargoCustomerNo: string | null;
    cargoAccountTitle: string | null;
    /** Kodun son geçerlilik tarihi */
    validUntil: string;
    /** Kargo entegrasyonundan referans numarası alındı mı? */
    isCargoCreated: boolean;
    /** Kargo kaydı oluşturulamadıysa null */
    cargo: ReturnClaimCargoResultResponse | null;
    /** Teknik hata metni — müşteriye gösterilmez, yalnızca loglanır */
    cargoErrorMessage: string | null;
}

/** GET .../return-claims/detail — talep satırı */
export interface ReturnClaimDetailLineResponse {
    id: string;
    sortOrder: number | string;
    orderLineId: string | null;
    externalClaimLineId: string | null;
    sourceItemCode: string | null;
    itemCode: string | null;
    itemName: string | null;
    colorCode: string | null;
    colorName: string | null;
    usedBarcode: string | null;
    /** Sağlayıcıdaki ürün görseli */
    sourceImageUrl: string | null;
    quantity: number | string;
    acceptedQuantity: number | string;
    rejectedQuantity: number | string;
    returnReasonCode: string | null;
    returnReasonName: string | null;
    sourceReason: string | null;
    customerNote: string | null;
    statusCode: number | string;
    statusName: string | null;
}

/**
 * GET /order-tracking/{companyId}/{extensionId}/{orderNo}/return-claims/detail
 * Siparişe açılmış iade talepleri — kod açıklamaları, kargo bilgisi ve satırlarla.
 */
export interface ReturnClaimDetailResponse {
    id: string;
    claimNumber: string;
    claimDate: string;
    orderNumber: string;
    extensionCode: string;
    externalClaimId: string | null;
    syncSource: number | string;
    statusCode: number | string;
    statusName: string | null;
    returnReasonCode: string | null;
    returnReasonName: string | null;
    afterReturnActionCode: string | null;
    afterReturnActionName: string | null;
    customerNote: string | null;
    /** Para iadesi için müşterinin IBAN'ı */
    iban: string | null;
    /** IBAN'ın ait olduğu hesap sahibinin adı / ünvanı */
    ibanAccountDescription: string | null;
    /** Müşterinin talepte belirttiği ad / ünvan */
    customerDescription: string | null;
    cargoExtensionId: string | null;
    cargoExtensionCode: string | null;
    cargoCompanyName: string | null;
    cargoCustomerNo: string | null;
    cargoAccountTitle: string | null;
    /** Kargo entegrasyonundan dönen referans numarası — oluşmadıysa null */
    cargoReferenceId: string | null;
    cargoTrackingNumber: string | null;
    receivedDate: string | null;
    note: string | null;
    createdDate: string;
    updatedDate: string;
    items: ReturnClaimDetailLineResponse[];
}

/**
 * Onay / ret kararının gövdesi.
 * Kaynak: v1 (56).yaml - WmsReturnClaimDecisionRequest
 * (.../return-claims/{claimNumber}/approve|reject)
 */
export interface ReturnClaimDecisionRequest {
    /** Karara eklenen açıklama — müşteriye giden bilgilendirmede kullanılır */
    note: string | null;
    /** Müşteriye bilgilendirme SMS'i gönderilsin mi (backend varsayılanı: true) */
    isSendSms: boolean;
}

/**
 * Karar sonucu — talebin yeni durumu ve bilgilendirme SMS'inin akıbeti.
 * SMS gönderilemese bile karar korunur; sebebi `smsError` alanında döner.
 * Kaynak: v1 (56).yaml - WmsReturnClaimDecisionResponse
 */
export interface ReturnClaimDecisionResponse {
    id: string;
    claimNumber: string;
    orderNumber: string;
    statusCode: number | string;
    statusName: string | null;
    note: string | null;
    decisionDate: string;
    isSmsSent: boolean;
    /** Bilgilendirmenin gittiği maskelenmiş telefon */
    maskedPhone: string | null;
    smsError: string | null;
}

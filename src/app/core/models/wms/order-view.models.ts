import { PaginationRequest } from '../pagination.model';

/**
 * Sipariş liste ve detay görünüm modelleri.
 * Kaynak: v1.yaml — POST /api/wms/orders/list, GET /api/wms/orders/{id}/details
 */

/** Liste filtreleri — sayfalama alanları dışında kalanlar */
export interface WmsOrderListFilter {
    statusCode?: number | null;
    extensionCode?: string | null;
    processCode?: string | null;
    orderTypeCode?: number | null;
    officeCode?: string | null;
    warehouseCode?: string | null;
    storeCode?: string | null;
    customerTypeCode?: number | null;
    customerCode?: string | null;
    itemCode?: string | null;
    isCancelOrder?: boolean | null;
    /** yyyy-MM-dd */
    startDate?: string | null;
    /** yyyy-MM-dd */
    endDate?: string | null;
}

export interface WmsOrderListRequest extends PaginationRequest, WmsOrderListFilter {}

export interface WmsOrderListItem {
    id: string;
    orderNumber: string;
    documentNumber: string;
    orderDate: string;
    orderTime: string;
    orderTypeCode: number;
    orderTypeDescription: string | null;
    processCode: string;
    processDescription: string | null;
    statusCode: number;
    statusDescription: string | null;
    statusDate: string | null;
    isCancelOrder: boolean;
    customerId: string | null;
    customerTypeCode: number;
    customerCode: string;
    customerName: string | null;
    shippingRecipient: string | null;
    shippingCityDescription: string | null;
    shippingDistrictDescription: string | null;
    extensionCode: string;
    extensionName: string | null;
    sourceOrderKey: string;
    externalOrderId: string | null;
    salesChannel: string | null;
    officeCode: string;
    warehouseCode: string;
    warehouseDescription: string | null;
    storeCode: string | null;
    lineCount: number;
    totalQuantity: number;
    totalNetAmount: number;
    doc_CurrencyCode: string;
    paymentMethodCode: string | null;
    paymentMethodDescription: string | null;
    isCashOnDelivery: boolean;
    deliveryCompanyCode: string | null;
    deliveryCompanyDescription: string | null;
    cargoTrackingNumber: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface WmsOrderHeaderDetail {
    id: string;
    companyId: string;
    orderNumber: string;
    documentNumber: string;
    orderDate: string;
    orderTime: string;
    orderTypeCode: number;
    orderTypeDescription: string | null;
    processCode: string;
    processDescription: string | null;
    statusCode: number;
    statusDescription: string | null;
    statusDate: string | null;
    isCancelOrder: boolean;
    description: string | null;
    internalDescription: string | null;
    isCommercial: boolean;
    officeCode: string;
    officeDescription: string | null;
    warehouseCode: string;
    warehouseDescription: string | null;
    storeCode: string | null;
    storeDescription: string | null;
    doc_CurrencyCode: string;
    localCurrencyCode: string;
    exchangeRate: number;
    isVatIncluded: boolean;
    isSalesViaInternet: boolean;
    isCashOnDelivery: boolean;
    shipmentMethodCode: string | null;
    shipmentMethodDescription: string | null;
    extensionCode: string;
    extensionName: string | null;
    companyExtensionId: string | null;
    sourceOrderKey: string;
    externalOrderId: string | null;
    externalPackageId: string | null;
    salesChannel: string | null;
    syncSource: number;
    sourceLastModifiedDate: string | null;
    lastSyncedDate: string;
    agreedDeliveryDate: string | null;
    isGiftBoxRequested: boolean;
    giftMessage: string | null;
    createdUserId: string;
    createdUserName: string | null;
    lastUpdatedUserId: string;
    lastUpdatedUserName: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface WmsOrderCustomerSummary {
    customerId: string;
    customerTypeCode: number;
    customerTypeDescription: string | null;
    customerCode: string;
    customerName: string | null;
    isIndividualAcc: boolean;
    email: string | null;
    mobile: string | null;
    taxOfficeCode: string | null;
    taxOfficeDescription: string | null;
    taxNumber: string | null;
    identityNum: string | null;
}

export interface WmsOrderAddressDetail {
    id: string;
    addressTypeCode: number;
    firstName: string | null;
    lastName: string | null;
    firstLastName: string | null;
    companyName: string | null;
    phone: string | null;
    address: string;
    countryCode: string | null;
    countryDescription: string | null;
    stateCode: string | null;
    stateDescription: string | null;
    cityCode: string | null;
    cityDescription: string | null;
    districtCode: string | null;
    districtDescription: string | null;
    quarterName: string | null;
    zipCode: string | null;
    taxOfficeCode: string | null;
    taxOfficeDescription: string | null;
    taxNumber: string | null;
    identityNum: string | null;
}

/** Satırın bir para birimindeki tutar dökümü */
export interface WmsOrderLineAmount {
    currencyCode: string;
    exchangeRate: number;
    relationCurrencyCode: string;
    priceVI: number;
    amountVI: number;
    price: number;
    amount: number;
    lDiscount: number;
    lDiscountVI: number;
    tDiscount: number;
    tDiscountVI: number;
    taxBase: number;
    pct: number;
    vat: number;
    vatDeduction: number;
    netAmount: number;
}

export interface WmsOrderLineDetail {
    id: string;
    sortOrder: number;
    itemId: string | null;
    itemCode: string | null;
    itemDescription: string | null;
    colorCode: string | null;
    colorDescription: string | null;
    itemDim1Code: string | null;
    itemDim1Description: string | null;
    imageUrl: string | null;
    usedBarcode: string | null;
    stockCode: string | null;
    externalLineId: string | null;
    externalProductId: string | null;
    lineDescription: string | null;
    quantity: number;
    cancelQuantity: number;
    pickedQuantity: number;
    returnedQuantity: number;
    remainingQuantity: number;
    cancelDate: string | null;
    cancelReason: string | null;
    statusCode: number;
    statusDescription: string | null;
    vatRate: number;
    commissionRate: number | null;
    price: number;
    priceCurrencyCode: string;
    priceExchangeRate: number;
    doc_CurrencyCode: string;
    amounts: WmsOrderLineAmount[];
}

export interface WmsOrderTotals {
    currencyCode: string;
    lineCount: number;
    totalQuantity: number;
    totalCancelQuantity: number;
    totalPickedQuantity: number;
    totalReturnedQuantity: number;
    grossAmount: number;
    discountAmount: number;
    taxBase: number;
    vatAmount: number;
    netAmount: number;
}

export interface WmsOrderPaymentDetail {
    id: string;
    sortOrder: number;
    paymentMethodCode: string;
    paymentMethodDescription: string | null;
    currencyCode: string;
    amount: number;
    installmentCount: number | null;
    paymentDate: string | null;
}

export interface WmsOrderCargoDetail {
    id: string;
    deliveryCompanyCode: string | null;
    deliveryCompanyDescription: string | null;
    cargoTrackingNumber: string | null;
    cargoTrackingLink: string | null;
    cargoSenderNumber: string | null;
    cargoDeci: number | null;
    packageCount: number;
    deliveryType: string | null;
    isFastDelivery: boolean;
    estimatedDeliveryStartDate: string | null;
    estimatedDeliveryEndDate: string | null;
    shippedDate: string | null;
    deliveredDate: string | null;
    isCurrent: boolean;
    createdDate: string;
}

export interface WmsOrderInvoiceSummary {
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    processCode: string;
    isReturn: boolean;
    isEInvoice: boolean;
    eInvoiceNumber: string | null;
    invoiceLink: string | null;
    isCompleted: boolean;
}

export interface WmsOrderClaimSummary {
    id: string;
    externalClaimId: string;
    claimDate: string;
    statusCode: number;
    statusDescription: string | null;
    lineCount: number;
    totalQuantity: number;
    cargoTrackingNumber: string | null;
    receivedDate: string | null;
}

export interface WmsOrderDetailResponse {
    header: WmsOrderHeaderDetail;
    customer: WmsOrderCustomerSummary | null;
    shippingAddress: WmsOrderAddressDetail | null;
    billingAddress: WmsOrderAddressDetail | null;
    lines: WmsOrderLineDetail[];
    totals: WmsOrderTotals;
    payments: WmsOrderPaymentDetail[];
    cargos: WmsOrderCargoDetail[];
    invoices: WmsOrderInvoiceSummary[];
    claims: WmsOrderClaimSummary[];
}

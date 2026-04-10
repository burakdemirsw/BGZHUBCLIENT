// ══════════════════════════════════════
//  TRENDYOL MODELS
// ══════════════════════════════════════

// === REQUEST MODELS ===

export interface ConnectTrendyolRequest {
  integrationId: string;
  supplierId: string;
  apiKey: string;
  apiSecret: string;
}

export interface TrendyolTestConnectionRequest {
  integrationUserId: string;
  companyId: string;
}

export interface TrendyolQuestionsFilterRequest {
  integrationUserId: string;
  companyId: string;
  barcode?: string | null;
  page?: number;
  size?: number;
  startDate?: string | null; // DateTime as ISO string (format: date-time)
  endDate?: string | null;   // DateTime as ISO string (format: date-time)
  status?: TrendyolQuestionStatus | null;
  orderByField?: TrendyolOrderByField | null;
  orderByDirection?: TrendyolOrderByDirection | null;
}

export interface TrendyolGetQuestionByIdRequest {
  integrationUserId: string;
  companyId: string;
  questionId: number;
}

export interface TrendyolAnswerQuestionRequest {
  integrationUserId: string;
  companyId: string;
  questionId: number;
  text: string | null;
}

export interface TrendyolSyncQuestionsRequest {
  integrationUserId: string;
  companyId: string;
  userId: string;
  startDate?: string | null; // DateTime as ISO string (format: date-time)
  endDate?: string | null;   // DateTime as ISO string (format: date-time)
  status?: TrendyolQuestionStatus | null;
  page?: number;
  size?: number;
}

// === RESPONSE MODELS ===

export interface ConnectTrendyolResponse {
  integrationUserId: string;
  userSocialMediaAccountId: string;
  userIntegrationUserSocialMediaAccountId: string;
  supplierIdPropertyId: string;
  apiKeyPropertyId: string;
  apiSecretPropertyId: string;
}

export interface TrendyolQuestionDto {
  id: number;
  text: string | null;
  customerId: number;
  userName: string | null;
  showUserName: boolean;
  status: string | null;
  creationDate: number;
  public: boolean;
  reason: string | null;
  reportReason: string | null;
  reportedDate: number | null;
  rejectedDate: number | null;
  answeredDateMessage: string | null;
  imageUrl: string | null;
  productName: string | null;
  productMainId: string | null;
  webUrl: string | null;
  answer: TrendyolAnswerDto | null;
  rejectedAnswer: TrendyolAnswerDto | null;
}

export interface TrendyolAnswerDto {
  id: number;
  text: string | null;
  creationDate: number;
  hasPrivateInfo?: boolean | null;
  reason?: string | null;
}

export interface TrendyolQuestionsPagedResponse {
  content: TrendyolQuestionDto[] | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface TrendyolAnswerQuestionResponse {
  answerId: number;
}

export interface TrendyolSyncQuestionsResponse {
  totalQuestionsFetched: number;
  newCustomersCreated: number;
  newConversationsCreated: number;
  newMessagesCreated: number;
  skippedAlreadyExists: number;
  details: TrendyolSyncedQuestionDetail[] | null;
}

export interface TrendyolSyncedQuestionDetail {
  trendyolQuestionId: number;
  customerId: string;
  conversationId: string;
  messageId: string | null;
  isNewCustomer: boolean;
  isNewConversation: boolean;
}

// === ENUMS ===

export enum TrendyolQuestionStatus {
  WAITING_FOR_ANSWER = 'WAITING_FOR_ANSWER',
  ANSWERED = 'ANSWERED',
  REPORTED = 'REPORTED',
  REJECTED = 'REJECTED',
  UNANSWERED = 'UNANSWERED'
}

export enum TrendyolOrderByField {
  LastModifiedDate = 'LastModifiedDate',
  CreatedDate = 'CreatedDate'
}

export enum TrendyolOrderByDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

// === BRANDS ===

export interface TrendyolGetBrandsRequest {
  integrationUserId: string;
  companyId: string;
  page?: number;
  size?: number;
}

export interface TrendyolBrand {
  id: number;
  name: string;
}

// ══════════════════════════════════════
//  TRENDYOL PRODUCTS
// ══════════════════════════════════════

export enum TrendyolDateQueryType {
  CreatedDate = 'CreatedDate',
  LastModifiedDate = 'LastModifiedDate'
}

export interface TrendyolFilterProductsRequest {
  integrationUserId: string;
  companyId: string;
  approved?: boolean | null;
  barcode?: string | null;
  startDate?: number | null; // Epoch timestamp
  endDate?: number | null;   // Epoch timestamp
  page?: number;
  size?: number;
  dateQueryType?: TrendyolDateQueryType | null;
  stockCode?: string | null;
  archived?: boolean | null;
  productMainId?: string | null;
  onSale?: boolean | null;
  rejected?: boolean | null;
  blacklisted?: boolean | null;
  brandIds?: number[] | null;
  specialConsumptionTax?: number | null;
}

export interface TrendyolProductsPagedResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  content: TrendyolProductDto[] | null;
}

export interface TrendyolProductDto {
  id: string | null;
  approved: boolean;
  archived: boolean;
  productCode: number;
  batchRequestId: string | null;
  supplierId: number;
  createDateTime: number;
  lastUpdateDate: number;
  gender: string | null;
  brand: string | null;
  barcode: string | null;
  title: string | null;
  categoryName: string | null;
  productMainId: string | null;
  description: string | null;
  stockUnitType: string | null;
  quantity: number;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  dimensionalWeight: number;
  stockCode: string | null;
  locationBasedDelivery: string | null;
  lotNumber: string | null;
  specialConsumptionTax: number;
  deliveryOption: TrendyolDeliveryOptionDto | null;
  images: TrendyolProductImageDto[] | null;
  attributes: TrendyolProductAttributeDto[] | null;
  platformListingId: string | null;
  stockId: string | null;
  hasActiveCampaign: boolean;
  locked: boolean;
  productContentId: number;
  pimCategoryId: number;
  brandId: number;
  version: number;
  color: string | null;
  size: string | null;
  lockedByUnSuppliedReason: boolean;
  onsale: boolean;
  productUrl: string | null;
}

export interface TrendyolDeliveryOptionDto {
  deliveryDuration?: number | null;
  fastDeliveryType?: string | null;
}

export interface TrendyolProductImageDto {
  url: string | null;
}

export interface TrendyolProductAttributeDto {
  attributeId: number;
  attributeName: string | null;
  attributeValueId: number | null;
  attributeValue: string | null;
}

// ══════════════════════════════════════
//  TRENDYOL ORDERS (SHIPMENT PACKAGES)
// ══════════════════════════════════════

export enum TrendyolOrderStatus {
  Created = 'Created',
  Picking = 'Picking',
  Invoiced = 'Invoiced',
  Shipped = 'Shipped',
  Cancelled = 'Cancelled',
  Delivered = 'Delivered',
  UnDelivered = 'UnDelivered',
  Returned = 'Returned'
}

export enum TrendyolShipmentOrderByField {
  PackageLastModifiedDate = 'PackageLastModifiedDate',
  CreatedDate = 'CreatedDate'
}

export interface TrendyolShipmentPackagesFilterRequest {
  integrationUserId: string;
  companyId: string;
  startDate?: number | null; // Epoch timestamp
  endDate?: number | null;   // Epoch timestamp
  page?: number;
  size?: number;
  orderNumber?: string | null;
  status?: TrendyolOrderStatus | null;
  orderByField?: TrendyolShipmentOrderByField | null;
  orderByDirection?: TrendyolOrderByDirection | null;
  shipmentPackageIds?: number[] | null;
}

export interface TrendyolShipmentPackagesPagedResponse {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  content: TrendyolShipmentPackageDto[] | null;
}

export interface TrendyolShipmentPackageDto {
  id: number;
  shipmentNumber: string | null;
  orderNumber: string | null;
  grossAmount: number;
  totalDiscount: number;
  totalTyDiscount: number;
  taxNumber: string | null;
  invoiceAddress: TrendyolAddressDto | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerEmail: string | null;
  customerId: number;
  customerTckn: string | null;
  shipmentAddress: TrendyolAddressDto | null;
  shipmentPackageStatus: string | null;
  status: string | null;
  deliveryType: string | null;
  timeSlotId: number | null;
  estimatedDeliveryStartDate: number | null;
  estimatedDeliveryEndDate: number | null;
  totalPrice: number;
  agreedDeliveryDate: number | null;
  agreedDeliveryDateExtendible: boolean;
  agreedDeliveryExtensionStartDate: number | null;
  agreedDeliveryExtensionEndDate: number | null;
  extendedAgreedDeliveryDate: number | null;
  deci: number;
  cargoTrackingNumber: string | null;
  cargoTrackingLink: string | null;
  cargoSenderNumber: string | null;
  cargoProviderName: string | null;
  cargoProviderId: number | null;
  lines: TrendyolOrderLineDto[] | null;
  packageHistory: TrendyolPackageHistoryDto[] | null;
  warehouseId: number | null;
}

export interface TrendyolAddressDto {
  id?: number | null;
  firstName?: string | null;
  lastName?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  postalCode?: string | null;
  countryCode?: string | null;
  fullAddress?: string | null;
  fullName?: string | null;
}

export interface TrendyolOrderLineDto {
  id: number;
  productSize: string | null;
  productColor: string | null;
  merchantSku: string | null;
  productName: string | null;
  productCode: number;
  merchantId: number;
  amount: number;
  discount: number;
  tyDiscount: number;
  currencyCode: string | null;
  productCategory: string | null;
  shipmentType: string | null;
  gift: boolean;
  fastDelivery: boolean;
  fastDeliveryType: string | null;
  sku: string | null;
  vatBaseAmount: number;
  barcode: string | null;
  orderLineItemStatusName: string | null;
  price: number;
  quantity: number;
  fastDeliveryOptions: string[] | null;
  salesCampaignId: number | null;
  productSellerCode: string | null;
  deliveryFeeType: string | null;
  laborCostPerItem: number;
}

export interface TrendyolPackageHistoryDto {
  createdDate: number;
  status: string | null;
}

// ══════════════════════════════════════
//  TRENDYOL PRODUCT SYNC
// ══════════════════════════════════════

export interface TrendyolSyncProductsRequest {
  integrationUserId: string;
  companyId: string;
  approved?: boolean | null;
  onSale?: boolean | null;
  archived?: boolean | null;
}

export interface TrendyolSyncProductsResponse {
  totalFetched: number;
  newProducts: number;
  updatedProducts: number;
  stockChangedProducts: number;
  skippedNoBarcodeProducts: number;
  errors: string[] | null;
}

export interface TrendyolProductSyncHealthRequest {
  integrationUserId: string;
  companyId: string;
}

export interface TrendyolProductSyncHealthResponse {
  totalInTrendyol: number;
  totalInDb: number;
  totalEmbedded: number;
  missingInDb: number;
  missingEmbeddings: number;
  syncRatioPercent: number;
  message: string | null;
}

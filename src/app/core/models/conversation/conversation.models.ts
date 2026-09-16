// ========================
// Sidebar Conversation Type Counts
// API'den dönen her tip için badge sayısı
// ========================

export interface ConversationTypeSidebarItem {
    type: string;           // messages | archived-messages | locked-messages | escalated-messages
    label: string;          // Gelen Mesajlar, Arşivlenenler, Kilitlenenler
    count: number;          // Badge sayısı
}

export interface ConversationSidebarResponse {
    items: ConversationTypeSidebarItem[];
}

// ========================
// Conversation Tag & Note Items
// ========================

export interface ConversationTagItem {
    id: string;
    name: string;
    colorCode?: string;
}

export interface ConversationNoteItem {
    id: string;
    noteText: string;
    createdDate?: string;
}

// ========================
// Conversation Header (Sohbet Başlığı)
// Orta paneldeki sohbet listesi
// ========================

export interface ConversationHeader {
    id: string;
    customerName: string;
    customerInitials: string;
    customerAvatarColor: string;
    socialMediaPhotoUrl?: string;
    integrationPhotoUrl?: string;
    lastMessage?: string;
    lastMessageDate?: string;
    lastMessageId?: string;
    unreadCount: number;
    isBlocked: boolean;
    isArchived: boolean;
    isFavorite: boolean;
    isLocked?: boolean;
    isEscalateToHuman?: boolean;
    isTest?: boolean;
}

// ========================
// Conversation List Response
// ========================

export interface ConversationListResponse {
    conversations: ConversationHeader[];
    totalCount: number;
}

// ========================
// Chat Message (Mesaj)
// ========================

export type MessageSource = 'user' | 'assistant' | 'ai';

export interface ChatMessage {
    id: string;
    conversationId: string;
    source?: MessageSource;
    text?: string;
    imageUrl?: string;
    isRead: boolean;
    createdDate?: string;
    responseType?: AiChatResponseType | null;
    blocks?: AiChatContentBlock[] | null;
    toolPayloads?: AiChatToolPayload[] | null;
    hasImage?: boolean;
    aiImageUrl?: string | null;
    hasExcel?: boolean;
    excelUrl?: string | null;
    isLiked?: boolean | null;
}

// ========================
// Conversation Messages Response
// Tek bir sohbetin mesajları + detayları
// ========================

export interface ConversationMessagesResponse {
    conversationId: string;
    customerDetail?: ConversationCustomerDetail;
    messages: ChatMessage[];
    tags: ConversationTagItem[];
    notes: ConversationNoteItem[];
    orders: ConversationOrderSummary[];
    totalCount: number;
}

export type AiChatResponseType = 'text' | 'table' | 'image' | 'imageGallery' | 'order' | 'mixed';
export type AiChatBlockType = 'text' | 'table' | 'image' | 'imageGallery' | 'order';

export interface AiChatTableData {
    columns: string[];
    rows: Record<string, string | null>[];
    totalRowCount: number | null;
    isTruncated: boolean;
}

export interface AiChatImageData {
    url: string;
    caption: string | null;
    alt: string | null;
}

export interface AiChatContentBlock {
    type: AiChatBlockType;
    title: string | null;
    order: number;
    text: string | null;
    table: AiChatTableData | null;
    images: AiChatImageData[] | null;
    orders?: AiChatOrderData[] | null;
}

export interface AiChatOrderAddress {
    fullName: string | null;
    addressLine: string | null;
    district: string | null;
    city: string | null;
    postalCode: string | null;
    countryCode: string | null;
    phone: string | null;
}

export interface AiChatOrderItem {
    name: string | null;
    sku: string | null;
    barcode: string | null;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number | null;
    imageUrl: string | null;
}

export interface AiChatOrderData {
    provider: string | null;
    orderNumber: string | null;
    orderId: string | null;
    orderDate: string | null;
    status: string | null;
    paymentStatus: string | null;
    totalPrice: number | null;
    currency: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    cargoCompany: string | null;
    cargoTrackingNumber: string | null;
    cargoTrackingUrl: string | null;
    shippingAddress: AiChatOrderAddress | null;
    billingAddress: AiChatOrderAddress | null;
    items: AiChatOrderItem[] | null;
    invoice: AiChatOrderInvoice | null;
    note: string | null;
}

export interface AiChatOrderInvoice {
    invoiceNumber: string | null;
    invoiceDate: string | null;
    invoiceUrl: string | null;
    isCorporate: boolean;
    companyName: string | null;
    taxOffice: string | null;
    taxNumber: string | null;
    identityNumber: string | null;
}

export interface AiChatToolPayload {
    success: boolean;
    toolName: string | null;
    queryKey: string | null;
    routeType: string | null;
    responseJson: string | null;
    rowCount: number | null;
    durationMs: number | null;
    error: string | null;
}

export interface AiChatResponse {
    success: boolean;
    response: string | null;
    error: string | null;
    model: string | null;
    inputTokens: number | null;
    outputTokens: number | null;
    totalTokens: number | null;
    costUsd: number | null;
    userMessageId?: string | null;
    assistantMessageId?: string | null;
    aiMessageId?: string | null;
    hasImage?: boolean;
    imageUrl?: string | null;
    hasExcel?: boolean;
    excelUrl?: string | null;
    responseType: AiChatResponseType;
    blocks: AiChatContentBlock[] | null;
    toolPayloads: AiChatToolPayload[] | null;
}

export interface ConversationReplyResponse {
    conversation: ConversationMessagesResponse;
    aiResponse: AiChatResponse;
    stats: ConversationStatsResponse;
}

export interface ConversationQuotaInfo {
    planName: string | null;
    maxMessageCount: number | null;
    usedMessageCount: number | null;
    remainingMessageCount: number | null;
    isUnlimited: boolean;
    subscriptionEndDate: string;
}

export interface ConversationStatsResponse {
    conversationId: string;
    totalMessageCount: number;
    userMessageCount: number;
    assistantMessageCount: number;
    toolCallCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    aiRequestCount: number;
    failedAiRequestCount: number;
    averageAiRequestDurationMs: number;
    lastModel: string | null;
    firstMessageDate: string | null;
    lastMessageDate: string | null;
    quota: ConversationQuotaInfo | null;
}

export interface ConversationReplyRequest {
    companyId: string;
    message: string;
    assistantId?: string | null;
    file?: string | null;
    fileType?: string | null;
}

export interface ConversationMessageReactionRequest {
    isLiked: boolean | null;
    reason?: string | null;
    description?: string | null;
}

export interface MessageReactionReasonResponse {
    id: string;
    messageId: string;
    userId: string;
    isLiked: boolean;
    reason: string | null;
    description: string | null;
    createdDate: string;
}

// ========================
// Customer Detail
// ========================

export interface ConversationCustomerDetail {
    customerId: string;
    firstName?: string;
    lastName?: string;
    platformUsername: string;
    platformName: string;
    status: string;
    isBlocked: boolean;
    contacts: ConversationCustomerContact[];
    addresses: ConversationCustomerAddress[];
}

export interface ConversationCustomerContact {
    id: string;
    contactTypeName: string;
    value: string;
    isDefault: boolean;
}

export interface ConversationCustomerAddress {
    id: string;
    cityName?: string;
    districtName?: string;
    addressLine: string;
    isDefault: boolean;
}

// ========================
// Order Summary
// ========================

export interface ConversationOrderSummary {
    orderId: string;
    integrationOrderNo?: string;
    orderStatusName?: string;
    paymentTypeName?: string;
    orderDate: string;
    currencyCode: string;
    totalAmount: number;
    itemCount: number;
    isCompleted: boolean;
    isCancel: boolean;
    createdDate: string;
}

// ========================
// Test Conversation Request
// ========================

export interface CreateTestConversationRequest {
    companyId: string;
    firstName: string;
    lastName: string;
    userIntSmaId?: string | null;
}

// ========================
// Create / Update Conversation Requests
// ========================

export interface CreateConversationRequest {
    userIntegrationUserSocialMediaAccountId: string;
    customerId: string;
    companyId: string;
    conversationTypeId: string;
}

export interface UpdateConversationRequest {
    userIntegrationUserSocialMediaAccountId: string;
    customerId: string;
    companyId: string;
    conversationTypeId: string;
    lastMessageDate?: string | null;
    isFavorite: boolean;
    isBlocked: boolean;
    isArchived: boolean;
    isLocked: boolean;
    isEscalateToHuman: boolean;
}

export interface ConversationResponse {
    id: string;
    userIntegrationUserSocialMediaAccountId: string;
    customerId: string;
    companyId: string;
    conversationTypeId: string;
    customerName?: string;
    lastMessageDate?: string | null;
    isFavorite: boolean;
    isBlocked: boolean;
    isArchived: boolean;
    isLocked: boolean;
    isEscalateToHuman: boolean;
    isTest: boolean;
    createdDate: string;
    updatedDate: string;
}


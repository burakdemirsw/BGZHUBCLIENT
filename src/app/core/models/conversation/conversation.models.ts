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


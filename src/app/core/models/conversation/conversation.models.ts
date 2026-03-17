// ========================
// Sidebar Conversation Type Counts
// API'den dönen her tip için badge sayısı
// ========================

export interface ConversationTypeSidebarItem {
    type: string;           // messages | archived-messages | locked-messages
    label: string;          // Gelen Mesajlar, Arşivlenenler, Kilitlenenler
    count: number;          // Badge sayısı
}

export type ConversationTypeSidebarResponse = ConversationTypeSidebarItem[];

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
    lastMessage: string;  
    lastMessageDate: string;
    unreadCount: number;
}

export type ConversationHeadersResponse = ConversationHeader[];

// ========================
// Chat Message (Mesaj)
// ========================

export type MessageSource = 'customer' | 'agent' | 'system' | 'ai';

export interface ChatMessage {
    id: string;
    conversationId: string;
    source: MessageSource;
    text: string;
    imageUrl?: string;
    isNote?: boolean;
    isRead?: boolean;
    createdDate?: string;
}

export type ChatMessagesResponse = ChatMessage[];


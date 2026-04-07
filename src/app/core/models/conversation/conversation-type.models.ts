export interface ConversationTypeResponse {
    id: string;
    conversationTypeCode?: string;
    conversationTypeDescription?: string;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateConversationTypeRequest {
    conversationTypeCode: string;
    conversationTypeDescription: string;
}

export interface UpdateConversationTypeRequest {
    conversationTypeCode: string;
    conversationTypeDescription: string;
    isActive: boolean;
}

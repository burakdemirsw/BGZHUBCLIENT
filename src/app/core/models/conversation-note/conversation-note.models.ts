export interface ConversationNote {
    id: string;
    conversationId?: string;
    userId?: string;
    companyId?: string;
    noteText?: string;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateConversationNoteRequest {
    conversationId: string;
    userId: string;
    companyId: string;
    noteText: string;
}

export interface UpdateConversationNoteRequest {
    noteText: string;
}

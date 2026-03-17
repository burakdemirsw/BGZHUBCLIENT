export interface ConversationTag {
    id: string;
    conversationId?: string;
    tagId?: string;
    tagName?: string;
    tagColor?: string;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateConversationTagRequest {
    conversationId: string;
    tagId: string;
}

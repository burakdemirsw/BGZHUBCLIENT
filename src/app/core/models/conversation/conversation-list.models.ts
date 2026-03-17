export interface ConversationListDescription {
    id: string;
    userId: string;
    name: string;
    description: string;
    colorCode: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateConversationListDescriptionRequest {
    userId: string;
    name: string;
    description: string;
    colorCode: string;
}

export interface UpdateConversationListDescriptionRequest {
    name: string;
    description: string;
    colorCode: string;
    isBlocked: boolean;
}

export interface AddConversationToListRequest {
    conversationId: string;
    listId: string;
}

export interface AddConversationsToListRequest {
    listId: string;
    conversationIds: string[];
}

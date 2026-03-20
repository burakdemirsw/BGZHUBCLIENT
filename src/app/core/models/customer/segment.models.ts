export interface Segment {
    id: string;
    userId?: string;
    name?: string;
    description?: string;
    colorCode?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateSegmentRequest {
    userId: string;
    companyId: string;
    name: string;
    description: string;
    colorCode: string;
}

export interface UpdateSegmentRequest {
    name: string;
    description: string;
    colorCode: string;
    isBlocked: boolean;
}

/** Tek konuşma → segment ataması */
export interface AddConversationToSegmentRequest {
    conversationId: string;
    segmentId: string;
    companyId: string;
}

/** Toplu konuşma → segment ataması */
export interface AddConversationsToSegmentRequest {
    segmentId: string;
    companyId: string;
    conversationIds: string[];
}

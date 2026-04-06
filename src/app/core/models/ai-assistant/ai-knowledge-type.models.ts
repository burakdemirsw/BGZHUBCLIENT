export interface AiKnowledgeTypeResponse {
    id: string;
    type: string | null;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface CreateAiKnowledgeTypeRequest {
    type: string;
}

export interface UpdateAiKnowledgeTypeRequest {
    type: string;
    isBlocked: boolean;
}

export interface AiKnowledgeResponse {
    id: string;
    companyId: string;
    userId: string;
    aiAssistantId: string;
    prop: string | null;
    value: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface CreateAiKnowledgeRequest {
    companyId: string;
    userId: string;
    aiAssistantId: string;
    prop: string;
    value: string;
}

export interface UpdateAiKnowledgeRequest {
    companyId: string;
    userId: string;
    aiAssistantId: string;
    prop: string;
    value: string;
}

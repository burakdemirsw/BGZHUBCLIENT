export interface AiKnowledgeResponse {
    id: string;
    companyId: string;
    userId: string;
    aiAssistantId: string;
    aiKnowledgeTypeId: string | null;
    integrationUserId: string | null;
    integrationDescription: string | null;
    prop: string | null;
    value: string | null;
    shortDescription: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface CreateAiKnowledgeRequest {
    companyId: string;
    userId: string;
    aiAssistantId: string;
    aiKnowledgeTypeId: string | null;
    integrationUserId: string | null;
    prop: string;
    value: string;
    shortDescription: string | null;
}

export interface UpdateAiKnowledgeRequest {
    companyId: string;
    userId: string;
    aiAssistantId: string;
    aiKnowledgeTypeId: string | null;
    integrationUserId: string | null;
    prop: string;
    value: string;
    shortDescription: string | null;
}

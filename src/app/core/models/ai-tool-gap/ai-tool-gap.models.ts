export interface AiToolGapResponse {
    id: string;
    aiToolGapReasonId: string;
    reasonCode?: string | null;
    reasonName?: string | null;
    companyId: string;
    extensionId?: string | null;
    extensionCode?: string | null;
    conversationId: string;
    userMessageId: string;
    userId?: string | null;
    assistantId?: string | null;
    requestText?: string | null;
    toolName?: string | null;
    toolArgumentsJson?: string | null;
    errorMessage?: string | null;
    contextJson?: string | null;
    isResolved: boolean;
    resolvedDate?: string | null;
    resolutionNote?: string | null;
    createdDate?: string;
    updatedDate?: string;
}

export interface AiToolGapPagedRequest {
    companyId?: string | null;
    aiToolGapReasonId?: string | null;
    extensionId?: string | null;
    isResolved?: boolean | null;
    searchTerm?: string | null;
    pageNumber?: number;
    pageSize?: number;
}

export interface UpdateAiToolGapRequest {
    isResolved: boolean;
    resolutionNote?: string | null;
}

export interface AiToolGapReasonResponse {
    id: string;
    code?: string | null;
    name?: string | null;
    description?: string | null;
    isActive: boolean;
    sortOrder: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface UpdateAiToolGapReasonRequest {
    name?: string | null;
    description?: string | null;
    isActive: boolean;
    sortOrder: number;
}

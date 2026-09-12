// ========================
// AI Message Models (/api/Ai/messages)
// ========================

export type AiMessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AiMessageResponse {
    id: string;
    messageId?: string | null;
    assistantId?: string | null;
    conversationId: string;
    role?: AiMessageRole | string | null;
    messageText?: string | null;
    toolName?: string | null;
    toolArgs?: string | null;
    responseId?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    costUsd?: number | null;
    source?: string | null;
    createdDate: string;
    updatedDate: string;
}

export interface CreateAiMessageRequest {
    messageId?: string | null;
    assistantId?: string | null;
    conversationId: string;
    role?: AiMessageRole | string | null;
    messageText?: string | null;
    toolName?: string | null;
    toolArgs?: string | null;
    responseId?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    costUsd?: number | null;
    source?: string | null;
}

// ========================
// Chat Completions (backend'e eklenecek)
// ========================

export interface ChatCompletionRequest {
    conversationId: string;
    assistantId?: string | null;
    messageText: string;
    stream?: boolean;
}

export interface ChatCompletionResponse {
    conversationId: string;
    userMessage: AiMessageResponse;
    assistantMessage: AiMessageResponse;
}

// ========================
// AiController Reply (/api/Ai/reply/{conversationId})
// ========================

export interface AiReplyByConversationRequest {
    companyId: string;
    message: string;
    userId?: string | null;
    assistantId?: string | null;
    file?: string | null;
    fileType?: string | null;
}

export interface AiChatResponse {
    success: boolean;
    response?: string | null;
    error?: string | null;
    model?: string | null;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    costUsd?: number | null;
    userMessageId?: string | null;
    assistantMessageId?: string | null;
    aiMessageId?: string | null;
}

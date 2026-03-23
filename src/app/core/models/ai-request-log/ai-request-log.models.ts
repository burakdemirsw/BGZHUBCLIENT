export interface AiRequestLogSummaryResponse {
    id: string;
    companyId: string;
    userId?: string;
    conversationId?: string;
    assistantId?: string;
    model?: string;
    statusCode?: number;
    isSuccess: boolean;
    errorMessage?: string;
    totalTokens?: number;
    costUsd?: number;
    durationMs?: number;
    createdDate: string;
}

export interface AiRequestLogResponse {
    id: string;
    companyId: string;
    userId?: string;
    conversationId?: string;
    assistantId?: string;
    endpoint?: string;
    model?: string;
    requestBody?: string;
    responseBody?: string;
    statusCode?: number;
    isSuccess: boolean;
    errorMessage?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
    durationMs?: number;
    createdDate: string;
    updatedDate: string;
}

// ── Report Filter ──────────────────────────────────────────
export interface AiReportFilterRequest {
    companyId?: string;
    startDate?: string;
    endDate?: string;
    model?: string;
}

// ── Usage Report ───────────────────────────────────────────
export interface AiUsageByModelResponse {
    model?: string;
    requestCount: number;
    totalTokens: number;
    totalCostUsd: number;
}

export interface AiUsageByDayResponse {
    date: string;
    requestCount: number;
    totalTokens: number;
    totalCostUsd: number;
}

export interface AiUsageReportResponse {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    totalCostUsd: number;
    averageDurationMs: number;
    usageByModel?: AiUsageByModelResponse[];
    usageByDay?: AiUsageByDayResponse[];
}

// ── Error Report ───────────────────────────────────────────
export interface AiErrorByStatusCodeResponse {
    statusCode?: number;
    count: number;
    sampleErrorMessage?: string;
}

export interface AiErrorDetailResponse {
    id: string;
    conversationId?: string;
    model?: string;
    statusCode?: number;
    errorMessage?: string;
    createdDate: string;
}

export interface AiErrorReportResponse {
    totalErrors: number;
    errorsByStatusCode?: AiErrorByStatusCodeResponse[];
    recentErrors?: AiErrorDetailResponse[];
}

// ── Cost Report ────────────────────────────────────────────
export interface AiCostByModelResponse {
    model?: string;
    requestCount: number;
    totalTokens: number;
    totalCostUsd: number;
    costPerThousandTokens: number;
}

export interface AiCostByDayResponse {
    date: string;
    requestCount: number;
    totalTokens: number;
    totalCostUsd: number;
}

export interface AiCostReportResponse {
    totalCostUsd: number;
    averageCostPerRequest: number;
    averageCostPerThousandTokens: number;
    costByModel?: AiCostByModelResponse[];
    costByDay?: AiCostByDayResponse[];
}

export interface ExtensionRequestLogSummaryResponse {
    id: string;
    companyId: string;
    userId?: string | null;
    conversationId?: string | null;
    providerCode?: string | null;
    toolName?: string | null;
    isSuccess: boolean;
    errorMessage?: string | null;
    rowCount?: number | null;
    durationMs?: number | null;
    createdDate: string;
}

export interface ExtensionRequestLogResponse extends ExtensionRequestLogSummaryResponse {
    requestJson?: string | null;
    responseJson?: string | null;
    updatedDate: string;
}

export interface ExtensionRequestLogPagedRequest {
    companyId?: string | null;
    providerCode?: string | null;
    toolName?: string | null;
    isSuccess?: boolean | null;
    conversationId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    searchTerm?: string | null;
    pageNumber?: number;
    pageSize?: number;
}

// ── Usage Report ───────────────────────────────────────────
export interface ExtensionReportFilterRequest {
    companyId?: string;
    startDate?: string;
    endDate?: string;
    providerCode?: string;
}

export interface ExtensionUsageByProviderResponse {
    providerCode?: string | null;
    requestCount: number;
    failedCount: number;
    successRate: number;
    averageDurationMs: number;
}

export interface ExtensionUsageByToolResponse {
    providerCode?: string | null;
    toolName?: string | null;
    requestCount: number;
    failedCount: number;
    successRate: number;
    averageDurationMs: number;
    sampleErrorMessage?: string | null;
}

export interface ExtensionUsageByDayResponse {
    date: string;
    requestCount: number;
    failedCount: number;
}

export interface ExtensionUsageReportResponse {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    averageDurationMs: number;
    usageByProvider?: ExtensionUsageByProviderResponse[] | null;
    usageByTool?: ExtensionUsageByToolResponse[] | null;
    usageByDay?: ExtensionUsageByDayResponse[] | null;
}

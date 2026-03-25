import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import {
    AiRequestLogSummaryResponse,
    AiRequestLogResponse,
    AiReportFilterRequest,
    AiUsageReportResponse,
    AiErrorReportResponse,
    AiCostReportResponse,
} from '../models/ai-request-log/ai-request-log.models';

@Injectable({
    providedIn: 'root',
})
export class AiRequestLogsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<AiRequestLogSummaryResponse>>> {
        return this.http.post<PagedResult<AiRequestLogSummaryResponse>>(
            { controller: 'AiRequestLogs', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<AiRequestLogResponse>> {
        return this.http.get<AiRequestLogResponse>({ controller: 'AiRequestLogs', action: id });
    }

    getByCompany(companyId: string, limit = 100): Promise<ApiResponse<AiRequestLogSummaryResponse[]>> {
        return this.http.get<AiRequestLogSummaryResponse[]>({
            controller: 'AiRequestLogs',
            action: `by-company/${companyId}`,
            queryString: `limit=${limit}`,
        });
    }

    getByConversation(conversationId: string): Promise<ApiResponse<AiRequestLogSummaryResponse[]>> {
        return this.http.get<AiRequestLogSummaryResponse[]>({
            controller: 'AiRequestLogs',
            action: `by-conversation/${conversationId}`,
        });
    }

    getFailed(companyId: string, limit = 100): Promise<ApiResponse<AiRequestLogSummaryResponse[]>> {
        return this.http.get<AiRequestLogSummaryResponse[]>({
            controller: 'AiRequestLogs',
            action: `failed/${companyId}`,
            queryString: `limit=${limit}`,
        });
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'AiRequestLogs', action: `delete/${id}` }, {});
    }

    // ── Rapor Endpoint'leri ────────────────────────────────────
    getUsageReport(filter: AiReportFilterRequest): Promise<ApiResponse<AiUsageReportResponse>> {
        return this.http.get<AiUsageReportResponse>({
            controller: 'AiRequestLogs',
            action: 'reports/usage',
            queryString: this.buildFilterQuery(filter),
        });
    }

    getErrorReport(filter: AiReportFilterRequest): Promise<ApiResponse<AiErrorReportResponse>> {
        return this.http.get<AiErrorReportResponse>({
            controller: 'AiRequestLogs',
            action: 'reports/errors',
            queryString: this.buildFilterQuery(filter),
        });
    }

    getCostReport(filter: AiReportFilterRequest): Promise<ApiResponse<AiCostReportResponse>> {
        return this.http.get<AiCostReportResponse>({
            controller: 'AiRequestLogs',
            action: 'reports/costs',
            queryString: this.buildFilterQuery(filter),
        });
    }

    private buildFilterQuery(filter: AiReportFilterRequest): string {
        const parts: string[] = [];
        if (filter.companyId) parts.push(`CompanyId=${encodeURIComponent(filter.companyId)}`);
        if (filter.startDate) parts.push(`StartDate=${encodeURIComponent(filter.startDate)}`);
        if (filter.endDate) parts.push(`EndDate=${encodeURIComponent(filter.endDate)}`);
        if (filter.model) parts.push(`Model=${encodeURIComponent(filter.model)}`);
        return parts.join('&');
    }
}

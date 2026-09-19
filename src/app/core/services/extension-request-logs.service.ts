import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from '../models/pagination.model';
import {
    ExtensionReportFilterRequest,
    ExtensionRequestLogPagedRequest,
    ExtensionRequestLogResponse,
    ExtensionRequestLogSummaryResponse,
    ExtensionUsageReportResponse,
} from '../models/extension-request-log/extension-request-log.models';

@Injectable({
    providedIn: 'root',
})
export class ExtensionRequestLogsService {
    constructor(private http: HttpClientService) {}

    getPaged(req: ExtensionRequestLogPagedRequest): Promise<ApiResponse<PagedResult<ExtensionRequestLogSummaryResponse>>> {
        return this.http.post<PagedResult<ExtensionRequestLogSummaryResponse>>(
            { controller: 'ExtensionRequestLogs', action: 'paged' },
            { pageNumber: 1, pageSize: 20, ...req },
        );
    }

    getById(id: string): Promise<ApiResponse<ExtensionRequestLogResponse>> {
        return this.http.get<ExtensionRequestLogResponse>({ controller: 'ExtensionRequestLogs', action: id });
    }

    getByConversation(conversationId: string): Promise<ApiResponse<ExtensionRequestLogSummaryResponse[]>> {
        return this.http.get<ExtensionRequestLogSummaryResponse[]>({
            controller: 'ExtensionRequestLogs',
            action: `by-conversation/${conversationId}`,
        });
    }

    getFailed(companyId: string, limit = 100): Promise<ApiResponse<ExtensionRequestLogSummaryResponse[]>> {
        return this.http.get<ExtensionRequestLogSummaryResponse[]>({
            controller: 'ExtensionRequestLogs',
            action: `failed/${companyId}`,
            queryString: `limit=${limit}`,
        });
    }

    delete(id: string): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: 'ExtensionRequestLogs', action: `delete/${id}` }, {});
    }

    getUsageReport(filter: ExtensionReportFilterRequest): Promise<ApiResponse<ExtensionUsageReportResponse>> {
        const parts: string[] = [];
        if (filter.companyId) parts.push(`CompanyId=${encodeURIComponent(filter.companyId)}`);
        if (filter.startDate) parts.push(`StartDate=${encodeURIComponent(filter.startDate)}`);
        if (filter.endDate) parts.push(`EndDate=${encodeURIComponent(filter.endDate)}`);
        if (filter.providerCode) parts.push(`ProviderCode=${encodeURIComponent(filter.providerCode)}`);
        return this.http.get<ExtensionUsageReportResponse>({
            controller: 'ExtensionRequestLogs',
            action: 'reports/usage',
            queryString: parts.join('&'),
        });
    }
}

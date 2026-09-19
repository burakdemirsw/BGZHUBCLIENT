import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from '../models/pagination.model';
import {
    AiToolGapPagedRequest,
    AiToolGapReasonResponse,
    AiToolGapResponse,
    UpdateAiToolGapReasonRequest,
    UpdateAiToolGapRequest,
} from '../models/ai-tool-gap/ai-tool-gap.models';

@Injectable({
    providedIn: 'root',
})
export class AiToolGapsService {
    constructor(private http: HttpClientService) {}

    getPaged(req: AiToolGapPagedRequest): Promise<ApiResponse<PagedResult<AiToolGapResponse>>> {
        return this.http.post<PagedResult<AiToolGapResponse>>(
            { controller: 'AiToolGaps', action: 'paged' },
            { pageNumber: 1, pageSize: 20, ...req },
        );
    }

    getById(id: string): Promise<ApiResponse<AiToolGapResponse>> {
        return this.http.get<AiToolGapResponse>({ controller: 'AiToolGaps', action: id });
    }

    update(id: string, body: UpdateAiToolGapRequest): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: 'AiToolGaps', action: `update/${id}` }, body);
    }

    delete(id: string): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: 'AiToolGaps', action: `delete/${id}` }, {});
    }

    getReasons(): Promise<ApiResponse<AiToolGapReasonResponse[]>> {
        return this.http.get<AiToolGapReasonResponse[]>({ controller: 'AiToolGaps', action: 'reasons' });
    }

    updateReason(id: string, body: UpdateAiToolGapReasonRequest): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: 'AiToolGaps', action: `reasons/update/${id}` }, body);
    }
}

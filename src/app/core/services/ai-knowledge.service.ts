import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult, PaginationRequest, buildPaginationRequest } from '../models/pagination.model';
import {
    AiKnowledgeResponse,
    CreateAiKnowledgeRequest,
    UpdateAiKnowledgeRequest,
} from '../models/ai-assistant/ai-knowledge.models';

@Injectable({
    providedIn: 'root',
})
export class AiKnowledgeService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<AiKnowledgeResponse[]>> {
        return this.http.get<AiKnowledgeResponse[]>({ controller: 'Ai', action: 'knowledge' });
    }

    getPaged(req?: Partial<PaginationRequest>): Promise<ApiResponse<PagedResult<AiKnowledgeResponse>>> {
        const body = buildPaginationRequest(req);
        return this.http.post<PagedResult<AiKnowledgeResponse>>(
            { controller: 'Ai', action: 'knowledge/paged' },
            body
        );
    }

    getById(id: string): Promise<ApiResponse<AiKnowledgeResponse>> {
        return this.http.get<AiKnowledgeResponse>({ controller: 'Ai', action: `knowledge/${id}` });
    }

    getByAssistant(assistantId: string): Promise<ApiResponse<AiKnowledgeResponse[]>> {
        return this.http.get<AiKnowledgeResponse[]>({
            controller: 'Ai',
            action: `knowledge/by-assistant/${assistantId}`,
        });
    }

    getByCompany(companyId: string): Promise<ApiResponse<AiKnowledgeResponse[]>> {
        return this.http.get<AiKnowledgeResponse[]>({
            controller: 'Ai',
            action: `knowledge/by-company/${companyId}`,
        });
    }

    create(request: CreateAiKnowledgeRequest): Promise<ApiResponse<AiKnowledgeResponse>> {
        return this.http.post<AiKnowledgeResponse>({ controller: 'Ai', action: 'knowledge' }, request);
    }

    update(id: string, request: UpdateAiKnowledgeRequest): Promise<ApiResponse<AiKnowledgeResponse>> {
        return this.http.post<AiKnowledgeResponse>({ controller: 'Ai', action: `update/knowledge/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<AiKnowledgeResponse>> {
        return this.http.post<AiKnowledgeResponse>({ controller: 'Ai', action: `delete/knowledge/${id}` }, {});
    }
}

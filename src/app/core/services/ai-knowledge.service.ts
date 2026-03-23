import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from '../models/pagination.model';
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

    getPaged(
        pageNumber = 1,
        pageSize = 10,
        searchTerm = '',
        companyId?: string
    ): Promise<ApiResponse<PagedResult<AiKnowledgeResponse>>> {
        let action = `knowledge?PageNumber=${pageNumber}&PageSize=${pageSize}`;
        if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
        if (companyId) action += `&CompanyId=${companyId}`;
        return this.http.get<PagedResult<AiKnowledgeResponse>>({ controller: 'Ai', action });
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

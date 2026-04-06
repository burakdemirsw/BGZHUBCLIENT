import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    AiKnowledgeTypeResponse,
    CreateAiKnowledgeTypeRequest,
    UpdateAiKnowledgeTypeRequest,
} from '../models/ai-assistant/ai-knowledge-type.models';

@Injectable({
    providedIn: 'root',
})
export class AiKnowledgeTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<AiKnowledgeTypeResponse[]>> {
        return this.http.get<AiKnowledgeTypeResponse[]>({ controller: 'Ai', action: 'knowledge-types' });
    }

    getById(id: string): Promise<ApiResponse<AiKnowledgeTypeResponse>> {
        return this.http.get<AiKnowledgeTypeResponse>({ controller: 'Ai', action: `knowledge-types/${id}` });
    }

    create(request: CreateAiKnowledgeTypeRequest): Promise<ApiResponse<AiKnowledgeTypeResponse>> {
        return this.http.post<AiKnowledgeTypeResponse>({ controller: 'Ai', action: 'knowledge-types' }, request);
    }

    update(id: string, request: UpdateAiKnowledgeTypeRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'Ai', action: `update/knowledge-types/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'Ai', action: `delete/knowledge-types/${id}` }, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    ConversationTypeResponse,
    CreateConversationTypeRequest,
    UpdateConversationTypeRequest,
} from '../models/conversation/conversation-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class ConversationTypesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<ConversationTypeResponse>>> {
        return this.http.post<PagedResult<ConversationTypeResponse>>(
            { controller: 'ConversationTypes', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<ConversationTypeResponse>> {
        return this.http.get<ConversationTypeResponse>({ controller: 'ConversationTypes', action: `${id}` });
    }

    create(request: CreateConversationTypeRequest): Promise<ApiResponse<ConversationTypeResponse>> {
        return this.http.post<ConversationTypeResponse>({ controller: 'ConversationTypes' }, request);
    }

    update(id: string, request: UpdateConversationTypeRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'ConversationTypes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'ConversationTypes', action: `delete/${id}` }, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateConversationTagRequest } from '../models/conversation-tag/conversation-tag.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ConversationTagsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'ConversationTags', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'ConversationTags', action: `${id}` });
    }

    getByConversation(conversationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'ConversationTags', action: `by-conversation/${conversationId}` });
    }

    getByTag(tagId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'ConversationTags', action: `by-tag/${tagId}` });
    }

    create(request: CreateConversationTagRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationTags' }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationTags', action: `delete/${id}` }, {});
    }
}

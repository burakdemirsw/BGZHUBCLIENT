import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateConversationNoteRequest, UpdateConversationNoteRequest } from '../models/conversation-note/conversation-note.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ConversationNotesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'ConversationNotes', action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'ConversationNotes', action: `${id}` });
    }

    getByConversation(conversationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'ConversationNotes', action: `by-conversation/${conversationId}` });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'ConversationNotes', action: `by-user/${userId}` });
    }

    create(request: CreateConversationNoteRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationNotes' }, request);
    }

    update(id: string, request: UpdateConversationNoteRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationNotes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationNotes', action: `delete/${id}` }, {});
    }
}

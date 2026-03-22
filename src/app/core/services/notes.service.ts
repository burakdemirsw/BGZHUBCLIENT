import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateNoteRequest, UpdateNoteRequest } from '../models/note/note.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class NotesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'Notes', action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Notes', action: `${id}` });
    }

    getByConversation(conversationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Notes', action: `by-conversation/${conversationId}` });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Notes', action: `by-user/${userId}` });
    }

    create(request: CreateNoteRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Notes' }, request);
    }

    update(id: string, request: UpdateNoteRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Notes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Notes', action: `delete/${id}` }, {});
    }
}

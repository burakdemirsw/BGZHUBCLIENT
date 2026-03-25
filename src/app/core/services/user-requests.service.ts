import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateUserRequestRequest,
    UpdateUserRequestRequest,
    CreateUserRequestMessageRequest,
} from '../models/user-request/user-request.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class UserRequestsService {
    constructor(private http: HttpClientService) {}

    // ── UserRequests ──
    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'UserRequests', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'UserRequests', action: id });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'UserRequests', action: `by-user/${userId}` });
    }

    getByAssignedUser(assignedUserId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'UserRequests', action: `by-assigned-user/${assignedUserId}` });
    }

    getByStatus(statusId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'UserRequests', action: `by-status/${statusId}` });
    }

    create(request: CreateUserRequestRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'UserRequests' }, request);
    }

    update(id: string, request: UpdateUserRequestRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'UserRequests', action: `update/${id}` }, request);
    }

    close(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'UserRequests', action: `close/${id}` }, {});
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'UserRequests', action: `delete/${id}` }, {});
    }

    // ── Messages ──
    getMessages(requestId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'UserRequests', action: `${requestId}/messages` });
    }

    createMessage(request: CreateUserRequestMessageRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'UserRequests', action: 'messages' }, request);
    }
}

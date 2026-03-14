import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateUserRequestRequest,
    UpdateUserRequestRequest,
    CreateUserRequestMessageRequest,
} from '../models/user-request/user-request.models';

@Injectable({
    providedIn: 'root',
})
export class UserRequestsService {
    constructor(private http: HttpClientService) {}

    // ── UserRequests ──
    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'UserRequests' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'UserRequests', action: id });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'UserRequests', action: `by-user/${userId}` });
    }

    getByAssignedUser(assignedUserId: string): Promise<any> {
        return this.http.get_new({ controller: 'UserRequests', action: `by-assigned-user/${assignedUserId}` });
    }

    getByStatus(statusId: string): Promise<any> {
        return this.http.get_new({ controller: 'UserRequests', action: `by-status/${statusId}` });
    }

    create(request: CreateUserRequestRequest): Promise<any> {
        return this.http.post({ controller: 'UserRequests' }, request);
    }

    update(id: string, request: UpdateUserRequestRequest): Promise<any> {
        return this.http.post({ controller: 'UserRequests', action: `update/${id}` }, request);
    }

    close(id: string): Promise<any> {
        return this.http.post({ controller: 'UserRequests', action: `close/${id}` }, {});
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'UserRequests', action: `delete/${id}` }, {});
    }

    // ── Messages ──
    getMessages(requestId: string): Promise<any> {
        return this.http.get_new({ controller: 'UserRequests', action: `${requestId}/messages` });
    }

    createMessage(request: CreateUserRequestMessageRequest): Promise<any> {
        return this.http.post({ controller: 'UserRequests', action: 'messages' }, request);
    }
}

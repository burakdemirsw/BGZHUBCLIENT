import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateConversationListDescriptionRequest,
    UpdateConversationListDescriptionRequest,
} from '../models/conversation/conversation-list.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ConversationListDescriptionsService {
    private controller = 'ConversationLists';

    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: this.controller, action: 'descriptions/paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: this.controller, action: `descriptions/${id}` });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: this.controller, action: `descriptions/by-user/${userId}` });
    }

    create(body: CreateConversationListDescriptionRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: 'descriptions' }, body);
    }

    update(id: string, body: UpdateConversationListDescriptionRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `descriptions/update/${id}` }, body);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `descriptions/delete/${id}` }, {});
    }
}

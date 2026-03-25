import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { AddConversationToSegmentRequest, AddConversationsToSegmentRequest } from '../models/customer/segment.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ConversationSegmentsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'ConversationSegments', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getByConversation(conversationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'ConversationSegments', action: `by-conversation/${conversationId}` });
    }

    getBySegment(segmentId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'ConversationSegments', action: `by-segment/${segmentId}` });
    }

    add(request: AddConversationToSegmentRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationSegments' }, request);
    }

    addBulk(request: AddConversationsToSegmentRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationSegments', action: 'bulk' }, request);
    }

    delete(conversationId: string, segmentId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationSegments', action: `delete/${conversationId}/${segmentId}` }, {});
    }

    clearSegment(segmentId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationSegments', action: `clear-segment/${segmentId}` }, {});
    }

    clearConversation(conversationId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'ConversationSegments', action: `clear-conversation/${conversationId}` }, {});
    }
}

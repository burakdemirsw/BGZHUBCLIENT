import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { AddConversationToSegmentRequest, AddConversationsToSegmentRequest } from '../models/customer/segment.models';

@Injectable({ providedIn: 'root' })
export class ConversationSegmentsService {
    constructor(private http: HttpClientService) {}

    getByConversation(conversationId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationSegments', action: `by-conversation/${conversationId}` });
    }

    getBySegment(segmentId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationSegments', action: `by-segment/${segmentId}` });
    }

    add(request: AddConversationToSegmentRequest): Promise<any> {
        return this.http.post({ controller: 'ConversationSegments' }, request);
    }

    addBulk(request: AddConversationsToSegmentRequest): Promise<any> {
        return this.http.post({ controller: 'ConversationSegments', action: 'bulk' }, request);
    }

    delete(conversationId: string, segmentId: string): Promise<any> {
        return this.http.post({ controller: 'ConversationSegments', action: `delete/${conversationId}/${segmentId}` }, {});
    }

    clearSegment(segmentId: string): Promise<any> {
        return this.http.post({ controller: 'ConversationSegments', action: `clear-segment/${segmentId}` }, {});
    }

    clearConversation(conversationId: string): Promise<any> {
        return this.http.post({ controller: 'ConversationSegments', action: `clear-conversation/${conversationId}` }, {});
    }
}

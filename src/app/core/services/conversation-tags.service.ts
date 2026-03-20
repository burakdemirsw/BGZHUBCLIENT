import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateConversationTagRequest } from '../models/conversation-tag/conversation-tag.models';

@Injectable({ providedIn: 'root' })
export class ConversationTagsService {
    constructor(private http: HttpClientService) {}

    getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        return this.http.get_new({
            controller: 'ConversationTags',
            action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
        });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationTags', action: `${id}` });
    }

    getByConversation(conversationId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationTags', action: `by-conversation/${conversationId}` });
    }

    getByTag(tagId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationTags', action: `by-tag/${tagId}` });
    }

    create(request: CreateConversationTagRequest): Promise<any> {
        return this.http.post({ controller: 'ConversationTags' }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'ConversationTags', action: `delete/${id}` }, {});
    }
}

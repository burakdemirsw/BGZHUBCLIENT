import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    AddConversationToListRequest,
    AddConversationsToListRequest,
} from '../models/conversation/conversation-list.models';

@Injectable({ providedIn: 'root' })
export class ConversationListsService {
    private controller = 'ConversationLists';

    constructor(private http: HttpClientService) {}

    getByList(listId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: this.controller, action: `by-list/${listId}` });
    }

    getByConversation(conversationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: this.controller, action: `by-conversation/${conversationId}` });
    }

    add(body: AddConversationToListRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller }, body);
    }

    addBulk(body: AddConversationsToListRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: 'bulk' }, body);
    }

    delete(conversationId: string, listId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `delete/${conversationId}/${listId}` }, {});
    }

    clearList(listId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `clear-list/${listId}` }, {});
    }

    clearConversation(conversationId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `clear-conversation/${conversationId}` }, {});
    }
}

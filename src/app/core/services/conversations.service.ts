import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { ConversationListResponse, ConversationMessagesResponse, ConversationSidebarResponse } from '../models/conversation/conversation.models';

@Injectable({ providedIn: 'root' })
export class ConversationsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'Conversations', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getSidebar(): Promise<ApiResponse<ConversationSidebarResponse>> {
        return this.http.get<ConversationSidebarResponse>({ controller: 'Conversations', action: 'sidebar' });
    }

    getList(type: string, page?: number, pageSize?: number, searchTerm?: string): Promise<ApiResponse<ConversationListResponse>> {
        const params: string[] = [`Type=${type}`];
        if (page) params.push(`Page=${page}`);
        if (pageSize) params.push(`PageSize=${pageSize}`);
        if (searchTerm) params.push(`SearchTerm=${searchTerm}`);
        return this.http.get<ConversationListResponse>({
            controller: 'Conversations',
            action: 'list',
            queryString: params.join('&'),
        });
    }

    getMessages(conversationId: string): Promise<ApiResponse<ConversationMessagesResponse>> {
        return this.http.get<ConversationMessagesResponse>({
            controller: 'Conversations',
            action: `${conversationId}/messages`,
        });
    }

    // ── Action endpoints ──
    private action(id: string, action: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'Conversations', action: `${id}/${action}` }, {});
    }

    archive(id: string)     { return this.action(id, 'archive');     }
    unarchive(id: string)   { return this.action(id, 'unarchive');   }
    block(id: string)       { return this.action(id, 'block');       }
    unblock(id: string)     { return this.action(id, 'unblock');     }
    favorite(id: string)    { return this.action(id, 'favorite');    }
    unfavorite(id: string)  { return this.action(id, 'unfavorite');  }
    lock(id: string)        { return this.action(id, 'lock');        }
    unlock(id: string)      { return this.action(id, 'unlock');      }
    escalate(id: string)    { return this.action(id, 'escalate');    }
    unescalate(id: string)  { return this.action(id, 'unescalate'); }
}

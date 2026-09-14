import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import {
    ConversationReplyResponse,
    ConversationListResponse,
    ConversationMessagesResponse,
    ConversationReplyRequest,
    ConversationMessageReactionRequest,
    ConversationResponse,
    ConversationSidebarResponse,
    CreateConversationRequest,
    CreateTestConversationRequest,
    UpdateConversationRequest,
} from '../models/conversation/conversation.models';

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
        const params: string[] = [`Type=${encodeURIComponent(type)}`];
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

    reply(
        conversationId: string,
        request: ConversationReplyRequest,
    ): Promise<ApiResponse<ConversationReplyResponse>> {
        const payload = {
            CompanyId: request.companyId,
            Message: request.message,
            AssistantId: request.assistantId ?? null,
            File: request.file ?? null,
            FileType: request.fileType ?? null,
        };

        return this.http.post<ConversationReplyResponse>(
            { controller: 'Conversations', action: `${conversationId}/reply` },
            payload,
        );
    }

    setMessageReaction(
        conversationId: string,
        messageId: string,
        request: ConversationMessageReactionRequest,
    ): Promise<ApiResponse<object>> {
        return this.http.post<object>(
            { controller: 'Conversations', action: `${conversationId}/messages/${messageId}/reaction` },
            request,
        );
    }

    // ── Action endpoints ──
    private action(id: string, action: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'Conversations', action: `${id}/${action}` }, {});
    }

    /** Test sohbeti oluşturur — POST create-conversation */
    createTestConversation(request: CreateTestConversationRequest): Promise<ApiResponse<string>> {
        return this.http.post<string>(
            { controller: 'Conversations', action: 'create-conversation' },
            request,
        );
    }

    /** POST /api/Conversations — yeni sohbet oluştur */
    create(request: CreateConversationRequest): Promise<ApiResponse<ConversationResponse>> {
        return this.http.post<ConversationResponse>({ controller: 'Conversations' }, request);
    }

    /** POST /api/Conversations/update/{id} — sohbet güncelle */
    update(id: string, request: UpdateConversationRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>(
            { controller: 'Conversations', action: `update/${id}` },
            request,
        );
    }

    /** POST /api/Conversations/delete/{id} — sohbet sil */
    remove(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'Conversations', action: `delete/${id}` }, {});
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

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    AiChatResponse,
    AiMessageResponse,
    AiReplyByConversationRequest,
    ChatCompletionRequest,
    ChatCompletionResponse,
    CreateAiMessageRequest,
} from '../models/ai-assistant/ai-message.models';

@Injectable({ providedIn: 'root' })
export class AiMessagesService {
    constructor(private http: HttpClientService) {}

    /** GET /api/Ai/messages/by-conversation/{conversationId} */
    getByConversation(conversationId: string): Promise<ApiResponse<AiMessageResponse[]>> {
        return this.http.get<AiMessageResponse[]>({
            controller: 'Ai',
            action: `messages/by-conversation/${conversationId}`,
        });
    }

    /** POST /api/Ai/messages */
    create(request: CreateAiMessageRequest): Promise<ApiResponse<AiMessageResponse>> {
        return this.http.post<AiMessageResponse>(
            { controller: 'Ai', action: 'messages' },
            request,
        );
    }

    /** POST /api/Ai/chat/completions (backend'e eklenecek) */
    chatCompletions(request: ChatCompletionRequest): Promise<ApiResponse<ChatCompletionResponse>> {
        return this.http.post<ChatCompletionResponse>(
            { controller: 'Ai', action: 'chat/completions' },
            request,
        );
    }

    /** POST /api/Ai/reply/{conversationId} */
    replyByConversation(
        conversationId: string,
        request: AiReplyByConversationRequest,
    ): Promise<ApiResponse<AiChatResponse>> {
        const payload = {
            CompanyId: request.companyId,
            Message: request.message,
            UserId: request.userId ?? null,
            AssistantId: request.assistantId ?? null,
            File: request.file ?? null,
            FileType: request.fileType ?? null,
        };

        return this.http.post<AiChatResponse>(
            { controller: 'Ai', action: `reply/${conversationId}` },
            payload,
        );
    }
}

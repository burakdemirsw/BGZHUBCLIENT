import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

export interface AiMessageDto {
  id?: string;
  messageId?: string;
  conversationId?: string;
  userId?: string;
  assistantId?: string;
  role?: string | null;
  messageContent?: string | null;
  messageText?: string | null;
  toolName?: string | null;
  toolArgs?: string | null;
  createdDate?: string;
  updatedDate?: string;
  responseId?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  source?: string;
  isRead?: boolean;
  isBlocked?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor(private httpClientService: HttpClientService) {}

  async getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.httpClientService.post<PagedResult<any>>(
      { controller: 'Messages', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  async getMessagesByConversation(conversationId: string): Promise<ApiResponse<AiMessageDto[]>> {
    return this.httpClientService.get<AiMessageDto[]>({
      controller: 'Ai',
      action: `messages/by-conversation/${conversationId}`,
    });
  }

  async sendMessage(request: {
    conversationId: string;
    messageContent: string;
    source?: string;
    platformMessageId?: string | null;
    file?: File | null;
    storyUrl?: string | null;
    createdUserId?: string | null;
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('ConversationId', request.conversationId);
    formData.append('MessageContent', request.messageContent);
    formData.append('Source', request.source ?? 'agent');
    if (request.platformMessageId) formData.append('PlatformMessageId', request.platformMessageId);
    if (request.storyUrl) formData.append('StoryUrl', request.storyUrl);
    if (request.createdUserId) formData.append('CreatedUserId', request.createdUserId);
    if (request.file) formData.append('File', request.file, request.file.name);

    return await this.httpClientService.post<any>(
      { controller: 'Messages' },
      formData
    );
  }

  async sendMessageWithFile(request: {
    conversationId: string;
    messageContent: string;
    file: File;
    source?: string;
    createdUserId?: string | null;
  }): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('ConversationId', request.conversationId);
    formData.append('MessageContent', request.messageContent);
    formData.append('File', request.file, request.file.name);
    formData.append('Source', request.source ?? 'agent');
    if (request.createdUserId) formData.append('CreatedUserId', request.createdUserId);

    return await this.httpClientService.post<any>(
      { controller: 'Messages', action: 'with-file' },
      formData
    );
  }

  async testAiChat(request: {
    conversationId: string;
    companyId: string;
    message: string;
    userId?: string;
  }): Promise<ApiResponse<any>> {
    return await this.httpClientService.post<any>(
      { controller: 'Webhook', action: 'test/ai-chat' },
      request
    );
  }
}

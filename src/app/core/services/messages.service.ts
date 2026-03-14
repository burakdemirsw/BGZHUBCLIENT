import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';

export interface AiMessageDto {
  id?: string;
  conversationId?: string;
  userId?: string;
  assistantId?: string;
  role?: string | null;
  messageContent?: string | null;
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

  async getMessagesByConversation(conversationId: string): Promise<AiMessageDto[]> {
    const response = await this.httpClientService.get_new({
      controller: 'Ai',
      action: `messages/by-conversation/${conversationId}`,
    });

    return this.extractArray(response);
  }

  private extractArray(response: unknown): AiMessageDto[] {
    if (!response) return [];
    if (Array.isArray(response)) return response as AiMessageDto[];

    const value = response as any;

    if (value?.data) {
      return (Array.isArray(value.data) ? value.data : [value.data]) as AiMessageDto[];
    }
    if (value?.items) {
      return (Array.isArray(value.items) ? value.items : [value.items]) as AiMessageDto[];
    }
    if (value?.result) {
      return (Array.isArray(value.result) ? value.result : [value.result]) as AiMessageDto[];
    }
    if (value?.$values) {
      return (Array.isArray(value.$values) ? value.$values : [value.$values]) as AiMessageDto[];
    }

    return [];
  }
}

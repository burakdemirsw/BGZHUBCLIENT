import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';

export interface DashboardStatsDto {
  aiAssistants: number;
  conversations: number;
  messages: number;
  customers: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardStatsService {
  constructor(private httpClientService: HttpClientService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [assistants, conversations, messages, customers] = await Promise.all([
      this.fetchItems('AiAssistants'),
      this.fetchItems('Conversations'),
      this.fetchItems('Ai', 'messages'),
      this.fetchItems('Customers'),
    ]);

    return {
      aiAssistants: assistants.length,
      conversations: conversations.length,
      messages: messages.length,
      customers: customers.length,
    };
  }

  private async fetchItems(controller: string, action?: string): Promise<unknown[]> {
    try {
      const response = await this.httpClientService.get_new({ controller, action });
      return this.normalize(response);
    } catch {
      return [];
    }
  }

  private normalize(payload: unknown): unknown[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    const value = payload as any;
    if (value?.data) {
      return Array.isArray(value.data) ? value.data : [value.data];
    }
    if (value?.items) {
      return Array.isArray(value.items) ? value.items : [value.items];
    }
    if (value?.result) {
      return Array.isArray(value.result) ? value.result : [value.result];
    }
    if (value?.$values) {
      return Array.isArray(value.$values) ? value.$values : [value.$values];
    }
    return [];
  }
}

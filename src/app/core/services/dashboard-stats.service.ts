import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { AuthStateService } from './auth-state.service';

export interface DashboardStatsDto {
  connections: number;
  orders: number;
  revenue: number;
  assistants: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardStatsService {
  constructor(
    private httpClientService: HttpClientService,
    private authStateService: AuthStateService
  ) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const companyId = this.authStateService.profile?.companyId || '';

    const [connectionsList, ordersList, assistantsList] = await Promise.all([
      this.fetchItems('IntegrationConnections'),
      companyId ? this.fetchItems('Orders', `company/${companyId}`) : Promise.resolve([]),
      this.fetchItems('AiAssistants'),
    ]);

    const revenue = (ordersList as any[]).reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      connections: connectionsList.length,
      orders: ordersList.length,
      revenue: Math.round(revenue),
      assistants: (assistantsList as any[]).filter(a => a.isActive !== false && a.isBlocked !== true).length,
    };
  }

  private async fetchItems(controller: string, action?: string): Promise<unknown[]> {
    try {
      const response = await this.httpClientService.get<any>({ controller, action });
      return this.normalize(response);
    } catch {
      return [];
    }
  }

  private normalize(response: ApiResponse<any>): unknown[] {
    const payload = response.data;
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    const value = payload as any;
    if (value?.$values) return value.$values;
    if (value?.data) return Array.isArray(value.data) ? value.data : [value.data];
    if (value?.items) return Array.isArray(value.items) ? value.items : [value.items];
    if (value?.result) return Array.isArray(value.result) ? value.result : [value.result];
    return [];
  }
}

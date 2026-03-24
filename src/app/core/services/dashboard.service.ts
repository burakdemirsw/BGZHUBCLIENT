import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { AuthStateService } from './auth-state.service';
import {
  MonthlySummaryResponse,
  DailySalesResponse,
  IntegrationCountsResponse,
  DailyAiRepliesResponse,
} from '../models/dashboard/dashboard.models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly controller = 'Dashboard';

  constructor(
    private httpClientService: HttpClientService,
    private authStateService: AuthStateService
  ) {}

  private get companyId(): string {
    return this.authStateService.profile?.companyId || '';
  }

  /**
   * Bu ayki müşteri, ürün, sipariş sayısı ve ciro bilgisi.
   */
  async getMonthlySummary(): Promise<MonthlySummaryResponse> {
    const response = await this.httpClientService.get<MonthlySummaryResponse>({
      controller: this.controller,
      action: `${this.companyId}/monthly-summary`,
    });
    return this.extractData(response);
  }

  /**
   * Son X günlük günlük satış istatistikleri.
   */
  async getDailySales(days: number = 7): Promise<DailySalesResponse> {
    const response = await this.httpClientService.get<DailySalesResponse>({
      controller: this.controller,
      action: `${this.companyId}/daily-sales`,
      queryString: `days=${days}`,
    });
    return this.extractData(response);
  }

  /**
   * Şirkete ait IntegrationUser ve SocialMediaAccount sayıları.
   */
  async getIntegrationCounts(): Promise<IntegrationCountsResponse> {
    const response = await this.httpClientService.get<IntegrationCountsResponse>({
      controller: this.controller,
      action: `${this.companyId}/integration-counts`,
    });
    return this.extractData(response);
  }

  /**
   * Son X günlük AI ile yanıtlanan mesaj sayısı.
   */
  async getDailyAiReplies(days: number = 7): Promise<DailyAiRepliesResponse> {
    const response = await this.httpClientService.get<DailyAiRepliesResponse>({
      controller: this.controller,
      action: `${this.companyId}/ai-replies`,
      queryString: `days=${days}`,
    });
    return this.extractData(response);
  }

  /**
   * ApiResponse wrapper'ından data'yı çıkarır.
   */
  private extractData<T>(response: ApiResponse<T>): T {
    if (response.data) return response.data;
    // Bazı durumlarda raw data direkt response olarak gelebilir
    return response as unknown as T;
  }
}

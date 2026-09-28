import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    MarketplaceQuestionDetailResponse,
    MarketplaceQuestionListItemResponse,
    MarketplaceQuestionListRequest,
    MarketplaceQuestionPlatformSummaryResponse,
    MarketplaceQuestionProviderResponse,
    MarketplaceQuestionStatusResponse,
    MarketplaceQuestionSyncRequest,
    MarketplaceQuestionSyncResult,
    PagedResult,
} from '../models/marketplace-questions/marketplace-questions.models';

const CONTROLLER = 'marketplace-questions';

@Injectable({ providedIn: 'root' })
export class MarketplaceQuestionsService {
    constructor(private http: HttpClientService) {}

    /** Sol panel: platform bazında açık / toplam soru sayıları */
    getPlatforms(companyId: string): Promise<ApiResponse<MarketplaceQuestionPlatformSummaryResponse>> {
        return this.http.get<MarketplaceQuestionPlatformSummaryResponse>({ controller: CONTROLLER, action: `by-company/${companyId}/platforms` });
    }

    /** Orta liste: providerCode boşsa tüm platformlar */
    getPaged(request: MarketplaceQuestionListRequest): Promise<ApiResponse<PagedResult<MarketplaceQuestionListItemResponse>>> {
        return this.http.post<PagedResult<MarketplaceQuestionListItemResponse>>({ controller: CONTROLLER, action: 'paged' }, request);
    }

    /** Sağ panel: soru, ürün, müşteri, platform ve cevaplar */
    getById(id: string): Promise<ApiResponse<MarketplaceQuestionDetailResponse>> {
        return this.http.get<MarketplaceQuestionDetailResponse>({ controller: CONTROLLER, action: id });
    }

    getStatuses(): Promise<ApiResponse<MarketplaceQuestionStatusResponse[]>> {
        return this.http.get<MarketplaceQuestionStatusResponse[]>({ controller: CONTROLLER, action: 'statuses' });
    }

    /** Soru aktarımı desteklenen sağlayıcılar; companyId verilirse şirketin extension kaydı ve aktifliği de döner */
    getProviders(companyId?: string): Promise<ApiResponse<MarketplaceQuestionProviderResponse[]>> {
        return this.http.get<MarketplaceQuestionProviderResponse[]>({
            controller: CONTROLLER,
            action: 'providers',
            queryString: companyId ? `companyId=${companyId}` : undefined,
        });
    }

    /** Soruları sağlayıcıdan çekip tablolara yazar (providerCode boşsa tüm platformlar) */
    sync(request: MarketplaceQuestionSyncRequest): Promise<ApiResponse<MarketplaceQuestionSyncResult[]>> {
        return this.http.post<MarketplaceQuestionSyncResult[]>({ controller: CONTROLLER, action: 'sync' }, request);
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { ConnectTrendyolRequest, UpdateTrendyolRequest, TrendyolResponse, ConnectTrendyolResponse } from '@/app/core/models/integration/integration-trendyol.models';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
  TrendyolTestConnectionRequest,
  TrendyolQuestionsFilterRequest,
  TrendyolQuestionsPagedResponse,
  TrendyolQuestionDto,
  TrendyolGetQuestionByIdRequest,
  TrendyolAnswerQuestionRequest,
  TrendyolAnswerQuestionResponse,
  TrendyolSyncQuestionsRequest,
  TrendyolSyncQuestionsResponse,
  TrendyolGetBrandsRequest,
  TrendyolBrand,
  TrendyolFilterProductsRequest,
  TrendyolProductsPagedResponse,
  TrendyolShipmentPackagesFilterRequest,
  TrendyolShipmentPackagesPagedResponse,
  TrendyolSyncProductsRequest,
  TrendyolSyncProductsResponse,
  TrendyolProductSyncHealthRequest,
  TrendyolProductSyncHealthResponse,
} from '@/app/core/models/trendyol/trendyol.models';

@Injectable({
    providedIn: 'root'
})
export class TrendyolService {
    private controller = 'Trendyol';

    constructor(private http: HttpClientService) { }

    async connect(request: ConnectTrendyolRequest): Promise<ApiResponse<ConnectTrendyolResponse>> {
        return this.http.post<ConnectTrendyolResponse>({ controller: this.controller, action: 'connect-trendyol' }, request);
    }

    async update(integrationUserId: string, request: UpdateTrendyolRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `update/${integrationUserId}` }, request);
    }

    async disconnect(integrationUserId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `disconnect/${integrationUserId}` }, {});
    }

    async getDetails(integrationUserId: string): Promise<ApiResponse<TrendyolResponse>> {
        return this.http.get<TrendyolResponse>({ controller: this.controller, action: `getById/${integrationUserId}` });
    }

    async testConnection(integrationUserId: string, companyId: string): Promise<ApiResponse<boolean>> {
        const request: TrendyolTestConnectionRequest = { integrationUserId, companyId };
        return this.http.post<boolean>({ controller: this.controller, action: 'test-connection' }, request);
    }

    // ══════════════════════════════════════
    //  Q&A - MÜŞTERİ SORULARI
    // ══════════════════════════════════════

    /**
     * Trendyol müşteri sorularını filtreli olarak çeker
     */
    async getQuestions(request: TrendyolQuestionsFilterRequest): Promise<ApiResponse<TrendyolQuestionsPagedResponse>> {
        return this.http.post<TrendyolQuestionsPagedResponse>(
            { controller: this.controller, action: 'questions' },
            request
        );
    }

    /**
     * Trendyol müşteri sorusunu ID ile çeker
     */
    async getQuestionById(request: TrendyolGetQuestionByIdRequest): Promise<ApiResponse<TrendyolQuestionDto>> {
        return this.http.post<TrendyolQuestionDto>(
            { controller: this.controller, action: 'questions/get-by-id' },
            request
        );
    }

    /**
     * Trendyol müşteri sorusunu cevaplar
     */
    async answerQuestion(request: TrendyolAnswerQuestionRequest): Promise<ApiResponse<TrendyolAnswerQuestionResponse>> {
        return this.http.post<TrendyolAnswerQuestionResponse>(
            { controller: this.controller, action: 'questions/answer' },
            request
        );
    }

    /**
     * Trendyol sorularını senkronize eder
     */
    async syncQuestions(request: TrendyolSyncQuestionsRequest): Promise<ApiResponse<TrendyolSyncQuestionsResponse>> {
        return this.http.post<TrendyolSyncQuestionsResponse>(
            { controller: this.controller, action: 'sync-questions' },
            request
        );
    }

    /**
     * Trendyol marka listesini çeker
     */
    async getBrands(request: TrendyolGetBrandsRequest): Promise<ApiResponse<TrendyolBrand[]>> {
        return this.http.post<TrendyolBrand[]>(
            { controller: this.controller, action: 'brands' },
            request
        );
    }

    // ══════════════════════════════════════
    //  PRODUCTS
    // ══════════════════════════════════════

    /**
     * Trendyol ürünlerini filtreli olarak çeker
     */
    async getProducts(request: TrendyolFilterProductsRequest): Promise<ApiResponse<TrendyolProductsPagedResponse>> {
        return this.http.post<TrendyolProductsPagedResponse>(
            { controller: this.controller, action: 'products' },
            request
        );
    }

    /**
     * Trendyol ürünlerini senkronize eder (DB'ye kaydeder)
     */
    async syncProducts(request: TrendyolSyncProductsRequest): Promise<ApiResponse<TrendyolSyncProductsResponse>> {
        return this.http.post<TrendyolSyncProductsResponse>(
            { controller: this.controller, action: 'sync-products' },
            request
        );
    }

    /**
     * Trendyol ürünlerini senkronize edip rapor oluşturur
     */
    async syncAndReportProducts(request: TrendyolSyncProductsRequest): Promise<ApiResponse<TrendyolSyncProductsResponse>> {
        return this.http.post<TrendyolSyncProductsResponse>(
            { controller: this.controller, action: 'sync-and-report-products' },
            request
        );
    }

    /**
     * Trendyol ürün senkronizasyon durumunu kontrol eder
     */
    async getProductHealth(request: TrendyolProductSyncHealthRequest): Promise<ApiResponse<TrendyolProductSyncHealthResponse>> {
        return this.http.post<TrendyolProductSyncHealthResponse>(
            { controller: this.controller, action: 'product-health' },
            request
        );
    }

    // ══════════════════════════════════════
    //  ORDERS (SHIPMENT PACKAGES)
    // ══════════════════════════════════════

    /**
     * Trendyol siparişlerini (shipment packages) filtreli olarak çeker
     */
    async getOrders(request: TrendyolShipmentPackagesFilterRequest): Promise<ApiResponse<TrendyolShipmentPackagesPagedResponse>> {
        return this.http.post<TrendyolShipmentPackagesPagedResponse>(
            { controller: this.controller, action: 'orders' },
            request
        );
    }
}

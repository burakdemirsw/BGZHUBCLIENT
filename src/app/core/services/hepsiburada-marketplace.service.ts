import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    MarketplaceCustomerQuery,
    MarketplaceCustomerResponse,
    MarketplaceToolResult,
} from '@/app/core/models/marketplace/marketplace.models';
import {
    HepsiburadaAnswerQuestionRequest,
    HepsiburadaCatalogProductResponse,
    HepsiburadaListingQuery,
    HepsiburadaListingResponse,
    HepsiburadaOrderListQuery,
    HepsiburadaOrderPageResponse,
    HepsiburadaProductQuery,
    HepsiburadaQuestionQuery,
} from '@/app/core/models/marketplace/hepsiburada.models';

/** ExtensionController üzerinden Hepsiburada pazaryeri verileri */
@Injectable({
    providedIn: 'root'
})
export class HepsiburadaMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'hepsiburada';

    async getOrders(query: HepsiburadaOrderListQuery): Promise<ApiResponse<HepsiburadaOrderPageResponse>> {
        return this.send<HepsiburadaOrderPageResponse, HepsiburadaOrderListQuery>('orders/list', query);
    }

    async getProducts(query: HepsiburadaProductQuery): Promise<ApiResponse<HepsiburadaCatalogProductResponse>> {
        return this.send<HepsiburadaCatalogProductResponse, HepsiburadaProductQuery>('products', query);
    }

    async getListings(query: HepsiburadaListingQuery): Promise<ApiResponse<HepsiburadaListingResponse>> {
        return this.send<HepsiburadaListingResponse, HepsiburadaListingQuery>('listings', query);
    }

    /** Sorular tipli değil; veri MarketplaceToolResult.dataJson içinde serbest JSON olarak döner */
    async getQuestions(query: HepsiburadaQuestionQuery): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.send<MarketplaceToolResult, HepsiburadaQuestionQuery>('customer-questions', query);
    }

    async answerQuestion(request: HepsiburadaAnswerQuestionRequest): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.send<MarketplaceToolResult, HepsiburadaAnswerQuestionRequest>('customer-questions/answer', request);
    }

    async getQuestionCount(): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.sendWithoutPayload<MarketplaceToolResult>('customer-questions/count');
    }

    async getCustomers(query: MarketplaceCustomerQuery): Promise<ApiResponse<MarketplaceCustomerResponse>> {
        return this.send<MarketplaceCustomerResponse, MarketplaceCustomerQuery>('customers', query);
    }
}

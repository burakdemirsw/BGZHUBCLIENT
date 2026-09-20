import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { MarketplaceCustomerResponse } from '@/app/core/models/marketplace/marketplace.models';
import {
    TrendyolAnswerQuestionRequest,
    TrendyolAnswerQuestionResponse,
    TrendyolApproveClaimItemsRequest,
    TrendyolClaimQuery,
    TrendyolClaimResponse,
    TrendyolCustomerQuery,
    TrendyolOrderQuery,
    TrendyolOrderResponse,
    TrendyolProductInventoryQuery,
    TrendyolProductInventoryResponse,
    TrendyolQuestionQuery,
    TrendyolQuestionResponse,
} from '@/app/core/models/marketplace/trendyol.models';

/** ExtensionController üzerinden Trendyol pazaryeri verileri */
@Injectable({
    providedIn: 'root'
})
export class TrendyolMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'trendyol';

    async getOrders(query: TrendyolOrderQuery): Promise<ApiResponse<TrendyolOrderResponse>> {
        return this.send<TrendyolOrderResponse, TrendyolOrderQuery>('orders', query);
    }

    async getProducts(query: TrendyolProductInventoryQuery): Promise<ApiResponse<TrendyolProductInventoryResponse>> {
        return this.send<TrendyolProductInventoryResponse, TrendyolProductInventoryQuery>('stocks', query);
    }

    async getClaims(query: TrendyolClaimQuery): Promise<ApiResponse<TrendyolClaimResponse>> {
        return this.send<TrendyolClaimResponse, TrendyolClaimQuery>('claims', query);
    }

    async approveClaimItems(request: TrendyolApproveClaimItemsRequest): Promise<ApiResponse<unknown>> {
        return this.send<unknown, TrendyolApproveClaimItemsRequest>('claims/approve', request);
    }

    async getQuestions(query: TrendyolQuestionQuery): Promise<ApiResponse<TrendyolQuestionResponse>> {
        return this.send<TrendyolQuestionResponse, TrendyolQuestionQuery>('customer-questions', query);
    }

    async answerQuestion(request: TrendyolAnswerQuestionRequest): Promise<ApiResponse<TrendyolAnswerQuestionResponse>> {
        return this.send<TrendyolAnswerQuestionResponse, TrendyolAnswerQuestionRequest>('customer-questions/answer', request);
    }

    async getCustomers(query: TrendyolCustomerQuery): Promise<ApiResponse<MarketplaceCustomerResponse>> {
        return this.send<MarketplaceCustomerResponse, TrendyolCustomerQuery>('customers', query);
    }
}

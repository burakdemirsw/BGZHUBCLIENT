import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    MarketplaceCustomerQuery,
    MarketplaceCustomerResponse,
    MarketplaceToolResult,
} from '@/app/core/models/marketplace/marketplace.models';
import {
    BeymenAnswerQuestionRequest,
    BeymenCatalogProduct,
    BeymenOrderQuery,
    BeymenProductBarcodeQuery,
    BeymenProductCodeQuery,
    BeymenProductListResponse,
    BeymenProductQuery,
    BeymenQuestionQuery,
    BeymenReportQuestionIssueRequest,
} from '@/app/core/models/marketplace/beymen.models';

/**
 * ExtensionController üzerinden Beymen pazaryeri verileri.
 * Müşteriler ve ürünler dışındaki uç noktalar tipli şema yerine `MarketplaceToolResult` döner.
 */
@Injectable({
    providedIn: 'root'
})
export class BeymenMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'beymen';

    async getOrders(query: BeymenOrderQuery): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.send<MarketplaceToolResult, BeymenOrderQuery>('orders', query);
    }

    async getProducts(query: BeymenProductQuery): Promise<ApiResponse<BeymenProductListResponse>> {
        return this.send<BeymenProductListResponse, BeymenProductQuery>('products', query);
    }

    async getProductsByProductCode(query: BeymenProductCodeQuery): Promise<ApiResponse<BeymenCatalogProduct[]>> {
        return this.send<BeymenCatalogProduct[], BeymenProductCodeQuery>('products/by-product-code', query);
    }

    async getProductsByBarcode(query: BeymenProductBarcodeQuery): Promise<ApiResponse<BeymenCatalogProduct[]>> {
        return this.send<BeymenCatalogProduct[], BeymenProductBarcodeQuery>('products/by-barcode', query);
    }

    async getQuestions(query: BeymenQuestionQuery): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.send<MarketplaceToolResult, BeymenQuestionQuery>('customer-questions', query);
    }

    async answerQuestion(request: BeymenAnswerQuestionRequest): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.send<MarketplaceToolResult, BeymenAnswerQuestionRequest>('customer-questions/answer', request);
    }

    async reportQuestionIssue(request: BeymenReportQuestionIssueRequest): Promise<ApiResponse<MarketplaceToolResult>> {
        return this.send<MarketplaceToolResult, BeymenReportQuestionIssueRequest>('customer-questions/report-issue', request);
    }

    async getCustomers(query: MarketplaceCustomerQuery): Promise<ApiResponse<MarketplaceCustomerResponse>> {
        return this.send<MarketplaceCustomerResponse, MarketplaceCustomerQuery>('customers', query);
    }
}

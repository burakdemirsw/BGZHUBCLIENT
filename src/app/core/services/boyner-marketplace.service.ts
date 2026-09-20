import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    MarketplaceCustomerQuery,
    MarketplaceCustomerResponse,
} from '@/app/core/models/marketplace/marketplace.models';
import {
    BoynerBatchRequestQuery,
    BoynerBatchRequestResultResponse,
    BoynerOrderQuery,
    BoynerOrderResponse,
    BoynerProductQuery,
    BoynerProductResponse,
    BoynerProductStockQuery,
    BoynerProductStockResponse,
} from '@/app/core/models/marketplace/boyner.models';

/** ExtensionController üzerinden Boyner pazaryeri verileri */
@Injectable({
    providedIn: 'root'
})
export class BoynerMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'boyner';

    async getOrders(query: BoynerOrderQuery): Promise<ApiResponse<BoynerOrderResponse>> {
        return this.send<BoynerOrderResponse, BoynerOrderQuery>('orders', query);
    }

    async getProducts(query: BoynerProductQuery): Promise<ApiResponse<BoynerProductResponse>> {
        return this.send<BoynerProductResponse, BoynerProductQuery>('products', query);
    }

    async getProductStock(query: BoynerProductStockQuery): Promise<ApiResponse<BoynerProductStockResponse>> {
        return this.send<BoynerProductStockResponse, BoynerProductStockQuery>('products/stock', query);
    }

    async getBatchRequest(query: BoynerBatchRequestQuery): Promise<ApiResponse<BoynerBatchRequestResultResponse>> {
        return this.send<BoynerBatchRequestResultResponse, BoynerBatchRequestQuery>('products/batch-requests', query);
    }

    async getCustomers(query: MarketplaceCustomerQuery): Promise<ApiResponse<MarketplaceCustomerResponse>> {
        return this.send<MarketplaceCustomerResponse, MarketplaceCustomerQuery>('customers', query);
    }
}

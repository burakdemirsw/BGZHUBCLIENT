import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    ShopifyCustomerPage,
    ShopifyCustomerQuery,
    ShopifyOrder,
    ShopifyOrderListQuery,
    ShopifyOrderPage,
    ShopifyOrderQuery,
    ShopifyProductPage,
    ShopifyProductQuery,
    ShopifyStockQuery,
    ShopifyStockResponse,
} from '@/app/core/models/marketplace/shopify.models';

/** ExtensionController üzerinden Shopify mağaza verileri */
@Injectable({
    providedIn: 'root'
})
export class ShopifyMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'shopify';

    async getOrders(query: ShopifyOrderListQuery): Promise<ApiResponse<ShopifyOrderPage>> {
        return this.send<ShopifyOrderPage, ShopifyOrderListQuery>('orders', query);
    }

    async getOrderById(query: ShopifyOrderQuery): Promise<ApiResponse<ShopifyOrder>> {
        return this.send<ShopifyOrder, ShopifyOrderQuery>('order-by-order-id', query);
    }

    async getProducts(query: ShopifyProductQuery): Promise<ApiResponse<ShopifyProductPage>> {
        return this.send<ShopifyProductPage, ShopifyProductQuery>('products', query);
    }

    async getStock(query: ShopifyStockQuery): Promise<ApiResponse<ShopifyStockResponse[]>> {
        return this.send<ShopifyStockResponse[], ShopifyStockQuery>('stock', query);
    }

    async getCustomers(query: ShopifyCustomerQuery): Promise<ApiResponse<ShopifyCustomerPage>> {
        return this.send<ShopifyCustomerPage, ShopifyCustomerQuery>('customers', query);
    }
}

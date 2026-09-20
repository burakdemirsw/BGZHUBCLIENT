import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    TicimaxCustomerQuery,
    TicimaxCustomerResponse,
    TicimaxOrderNumberQuery,
    TicimaxOrderQuery,
    TicimaxProductQuery,
    TicimaxProductResponse,
    TicimaxProductStockResponse,
    TicimaxStockQuery,
    WebSiparis,
} from '@/app/core/models/marketplace/ticimax.models';

/** ExtensionController üzerinden Ticimax pazaryeri verileri */
@Injectable({
    providedIn: 'root'
})
export class TicimaxMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'ticimax';

    async getOrders(query: TicimaxOrderQuery): Promise<ApiResponse<WebSiparis[]>> {
        return this.send<WebSiparis[], TicimaxOrderQuery>('orders', query);
    }

    async getOrderByNumber(query: TicimaxOrderNumberQuery): Promise<ApiResponse<WebSiparis>> {
        return this.send<WebSiparis, TicimaxOrderNumberQuery>('order-by-order-number', query);
    }

    async getProducts(query: TicimaxProductQuery): Promise<ApiResponse<TicimaxProductResponse[]>> {
        return this.send<TicimaxProductResponse[], TicimaxProductQuery>('products', query);
    }

    async getStocks(query: TicimaxStockQuery): Promise<ApiResponse<TicimaxProductStockResponse[]>> {
        return this.send<TicimaxProductStockResponse[], TicimaxStockQuery>('stocks', query);
    }

    async getCustomers(query: TicimaxCustomerQuery): Promise<ApiResponse<TicimaxCustomerResponse[]>> {
        return this.send<TicimaxCustomerResponse[], TicimaxCustomerQuery>('customers', query);
    }
}

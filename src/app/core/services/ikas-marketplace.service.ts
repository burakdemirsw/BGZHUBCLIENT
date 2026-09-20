import { Injectable } from '@angular/core';
import { MarketplaceExtensionService } from '@/app/core/services/marketplace-extension.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import {
    IkasCustomerPage,
    IkasCustomerQuery,
    IkasOrderPage,
    IkasOrderQuery,
    IkasProductDetailResponse,
    IkasProductQuery,
    IkasStockLocationResponse,
    IkasStockQuery,
    IkasVariantStockResponse,
} from '@/app/core/models/marketplace/ikas.models';

/** ExtensionController üzerinden ikas pazaryeri verileri */
@Injectable({
    providedIn: 'root'
})
export class IkasMarketplaceService extends MarketplaceExtensionService {
    protected provider = 'ikas';

    async getOrders(query: IkasOrderQuery): Promise<ApiResponse<IkasOrderPage>> {
        return this.send<IkasOrderPage, IkasOrderQuery>('orders', query);
    }

    async getProducts(query: IkasProductQuery): Promise<ApiResponse<IkasProductDetailResponse[]>> {
        return this.send<IkasProductDetailResponse[], IkasProductQuery>('products', query);
    }

    async getStocks(query: IkasStockQuery): Promise<ApiResponse<IkasVariantStockResponse[]>> {
        return this.send<IkasVariantStockResponse[], IkasStockQuery>('stocks', query);
    }

    async getStockLocations(): Promise<ApiResponse<IkasStockLocationResponse[]>> {
        return this.sendWithoutPayload<IkasStockLocationResponse[]>('stock-locations');
    }

    async getCustomers(query: IkasCustomerQuery): Promise<ApiResponse<IkasCustomerPage>> {
        return this.send<IkasCustomerPage, IkasCustomerQuery>('customers', query);
    }
}

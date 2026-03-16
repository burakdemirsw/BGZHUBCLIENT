import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateProductRequest, UpdateProductRequest } from '../models/product/product.models';

@Injectable({
    providedIn: 'root',
})
export class ProductsService {
    constructor(private http: HttpClientService) {}

    getAll(params?: {
        pageNumber?: number;
        pageSize?: number;
        searchTerm?: string;
        brand?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        isActive?: boolean;
        integrationId?: string;
        sortBy?: string;
        sortDescending?: boolean;
    }): Promise<any> {
        let qs = '';
        if (params) {
            const parts: string[] = [];
            if (params.pageNumber != null) parts.push(`PageNumber=${params.pageNumber}`);
            if (params.pageSize != null) parts.push(`PageSize=${params.pageSize}`);
            if (params.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
            if (params.brand) parts.push(`Brand=${encodeURIComponent(params.brand)}`);
            if (params.category) parts.push(`Category=${encodeURIComponent(params.category)}`);
            if (params.minPrice != null) parts.push(`MinPrice=${params.minPrice}`);
            if (params.maxPrice != null) parts.push(`MaxPrice=${params.maxPrice}`);
            if (params.isActive != null) parts.push(`IsActive=${params.isActive}`);
            if (params.integrationId) parts.push(`IntegrationId=${params.integrationId}`);
            if (params.sortBy) parts.push(`SortBy=${encodeURIComponent(params.sortBy)}`);
            if (params.sortDescending != null) parts.push(`SortDescending=${params.sortDescending}`);
            qs = parts.join('&');
        }
        return this.http.get_new({ controller: 'Products', queryString: qs || undefined });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Products', action: `${id}` });
    }

    getByCode(productCode: string): Promise<any> {
        return this.http.get_new({ controller: 'Products', action: `by-code/${productCode}` });
    }

    getByIntegration(integrationId: string): Promise<any> {
        return this.http.get_new({ controller: 'Products', action: `by-integration/${integrationId}` });
    }

    create(request: CreateProductRequest): Promise<any> {
        return this.http.post({ controller: 'Products' }, request);
    }

    update(id: string, request: UpdateProductRequest): Promise<any> {
        return this.http.post({ controller: 'Products', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Products', action: `delete/${id}` }, {});
    }
}

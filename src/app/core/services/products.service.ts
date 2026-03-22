import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
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
    }): Promise<ApiResponse<any>> {
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
        return this.http.get<any>({ controller: 'Products', queryString: qs || undefined });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Products', action: `${id}` });
    }

    getByCode(productCode: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Products', action: `by-code/${productCode}` });
    }

    getByIntegration(integrationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Products', action: `by-integration/${integrationId}` });
    }

    /** CompanyId'ye göre ürünleri sayfalı olarak listeler */
    getByCompany(companyId: string, params?: {
        pageNumber?: number;
        pageSize?: number;
        searchTerm?: string;
        itemCode?: string;
        barcode?: string;
        name?: string;
        brand?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        isActive?: boolean;
        integrationUserId?: string;
        sortBy?: string;
        sortDescending?: boolean;
    }): Promise<ApiResponse<any>> {
        const parts: string[] = [];
        if (params) {
            if (params.pageNumber != null) parts.push(`PageNumber=${params.pageNumber}`);
            if (params.pageSize != null) parts.push(`PageSize=${params.pageSize}`);
            if (params.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
            if (params.itemCode) parts.push(`ItemCode=${encodeURIComponent(params.itemCode)}`);
            if (params.barcode) parts.push(`Barcode=${encodeURIComponent(params.barcode)}`);
            if (params.name) parts.push(`Name=${encodeURIComponent(params.name)}`);
            if (params.brand) parts.push(`Brand=${encodeURIComponent(params.brand)}`);
            if (params.category) parts.push(`Category=${encodeURIComponent(params.category)}`);
            if (params.minPrice != null) parts.push(`MinPrice=${params.minPrice}`);
            if (params.maxPrice != null) parts.push(`MaxPrice=${params.maxPrice}`);
            if (params.isActive != null) parts.push(`IsActive=${params.isActive}`);
            if (params.integrationUserId) parts.push(`IntegrationUserId=${params.integrationUserId}`);
            if (params.sortBy) parts.push(`SortBy=${encodeURIComponent(params.sortBy)}`);
            if (params.sortDescending != null) parts.push(`SortDescending=${params.sortDescending}`);
        }
        const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
        return this.http.get<any>({ controller: 'Products', action: `by-company/${companyId}${qs}` });
    }

    create(request: CreateProductRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Products' }, request);
    }

    update(id: string, request: UpdateProductRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Products', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Products', action: `delete/${id}` }, {});
    }
}

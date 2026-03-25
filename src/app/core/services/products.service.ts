import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { CreateProductRequest, UpdateProductRequest, ProductFilterRequest } from '../models/product/product.models';

@Injectable({
    providedIn: 'root',
})
export class ProductsService {
    constructor(private http: HttpClientService) {}

    getAll(req?: ProductFilterRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'Products', action: 'paged' },
            { ...buildPaginationRequest(req), ...req },
        );
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
    getByCompany(companyId: string, req?: ProductFilterRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'Products', action: 'by-company/paged' },
            { ...buildPaginationRequest(req), ...req, companyId },
        );
    }

    /** POST /api/Products/list - Filter ile ürünleri listeler */
    getList(filter: any): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Products', action: 'list' }, filter);
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

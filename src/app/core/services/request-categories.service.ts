import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { RequestCategoryResponse, CreateRequestCategoryRequest, UpdateRequestCategoryRequest } from '../models/request-category/request-category.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class RequestCategoriesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<RequestCategoryResponse>>> {
        return this.http.post<PagedResult<RequestCategoryResponse>>(
            { controller: 'RequestCategories', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<RequestCategoryResponse>> {
        return this.http.get<RequestCategoryResponse>({ controller: 'RequestCategories', action: id });
    }

    create(request: CreateRequestCategoryRequest): Promise<ApiResponse<RequestCategoryResponse>> {
        return this.http.post<RequestCategoryResponse>({ controller: 'RequestCategories' }, request);
    }

    update(id: string, request: UpdateRequestCategoryRequest): Promise<ApiResponse<RequestCategoryResponse>> {
        return this.http.post<RequestCategoryResponse>({ controller: 'RequestCategories', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<RequestCategoryResponse>> {
        return this.http.post<RequestCategoryResponse>({ controller: 'RequestCategories', action: `delete/${id}` }, {});
    }
}

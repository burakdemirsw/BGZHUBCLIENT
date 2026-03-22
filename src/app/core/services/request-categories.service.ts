import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestCategoryRequest, UpdateRequestCategoryRequest } from '../models/request-category/request-category.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class RequestCategoriesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'RequestCategories', action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'RequestCategories', action: id });
    }

    create(request: CreateRequestCategoryRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestCategories' }, request);
    }

    update(id: string, request: UpdateRequestCategoryRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestCategories', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestCategories', action: `delete/${id}` }, {});
    }
}

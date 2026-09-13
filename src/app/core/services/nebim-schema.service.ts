import { Injectable } from '@angular/core';
import { ApiResponse } from '../models/api-response.model';
import {
    CreateNebimSchemaCategoryRequest,
    CreateNebimSchemaColumnRequest,
    CreateNebimSchemaObjectRequest,
    NebimSchemaCategoryResponse,
    NebimSchemaColumnResponse,
    NebimSchemaObjectResponse,
    SetNebimSchemaObjectCategoriesRequest,
    UpdateNebimSchemaCategoryRequest,
    UpdateNebimSchemaColumnRequest,
    UpdateNebimSchemaObjectRequest,
} from '../models/nebim-schema/nebim-schema.models';
import { PaginationRequest, PagedResult, buildPaginationRequest } from '../models/pagination.model';
import { HttpClientService } from './http-client.service';

@Injectable({
    providedIn: 'root',
})
export class NebimSchemaService {
    constructor(private http: HttpClientService) {}

    getObjectsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<NebimSchemaObjectResponse>>> {
        return this.http.post<PagedResult<NebimSchemaObjectResponse>>(
            { controller: 'NebimSchema', action: 'objects/paged' },
            buildPaginationRequest(req),
        );
    }

    createObject(request: CreateNebimSchemaObjectRequest): Promise<ApiResponse<NebimSchemaObjectResponse>> {
        return this.http.post<NebimSchemaObjectResponse>({ controller: 'NebimSchema', action: 'objects' }, request);
    }

    updateObject(id: string, request: UpdateNebimSchemaObjectRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `objects/update/${id}` }, request);
    }

    deleteObject(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `objects/delete/${id}` }, {});
    }

    getColumnsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<NebimSchemaColumnResponse>>> {
        return this.http.post<PagedResult<NebimSchemaColumnResponse>>(
            { controller: 'NebimSchema', action: 'columns/paged' },
            buildPaginationRequest(req),
        );
    }

    createColumn(request: CreateNebimSchemaColumnRequest): Promise<ApiResponse<NebimSchemaColumnResponse>> {
        return this.http.post<NebimSchemaColumnResponse>({ controller: 'NebimSchema', action: 'columns' }, request);
    }

    updateColumn(id: string, request: UpdateNebimSchemaColumnRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `columns/update/${id}` }, request);
    }

    deleteColumn(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `columns/delete/${id}` }, {});
    }

    getCategories(): Promise<ApiResponse<NebimSchemaCategoryResponse[]>> {
        return this.http.get<NebimSchemaCategoryResponse[]>({ controller: 'NebimSchema', action: 'categories' });
    }

    getCategoryById(id: string): Promise<ApiResponse<NebimSchemaCategoryResponse>> {
        return this.http.get<NebimSchemaCategoryResponse>({ controller: 'NebimSchema', action: `categories/${id}` });
    }

    createCategory(request: CreateNebimSchemaCategoryRequest): Promise<ApiResponse<NebimSchemaCategoryResponse>> {
        return this.http.post<NebimSchemaCategoryResponse>({ controller: 'NebimSchema', action: 'categories' }, request);
    }

    updateCategory(id: string, request: UpdateNebimSchemaCategoryRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `categories/update/${id}` }, request);
    }

    deleteCategory(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `categories/delete/${id}` }, {});
    }

    getObjectCategories(schemaObjectId: string): Promise<ApiResponse<NebimSchemaCategoryResponse[]>> {
        return this.http.get<NebimSchemaCategoryResponse[]>({ controller: 'NebimSchema', action: `objects/${schemaObjectId}/categories` });
    }

    setObjectCategories(schemaObjectId: string, request: SetNebimSchemaObjectCategoriesRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'NebimSchema', action: `objects/${schemaObjectId}/categories` }, request);
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateIntegrationConnectionTypeRequest,
    UpdateIntegrationConnectionTypeRequest,
} from '../models/integration/integration-connection-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class IntegrationConnectionTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationConnectionTypes' });
    }

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'IntegrationConnectionTypes', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'IntegrationConnectionTypes', action: `${id}` });
    }

    getByCode(code: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'IntegrationConnectionTypes', action: `by-code/${code}` });
    }

    create(request: CreateIntegrationConnectionTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationConnectionTypes' }, request);
    }

    update(id: string, request: UpdateIntegrationConnectionTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationConnectionTypes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationConnectionTypes', action: `delete/${id}` }, {});
    }
}

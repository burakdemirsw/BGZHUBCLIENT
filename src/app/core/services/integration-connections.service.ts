import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateIntegrationConnectionRequest,
    UpdateIntegrationConnectionRequest,
} from '../models/integration/integration-connection.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class IntegrationConnectionsService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationConnections' });
    }

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'IntegrationConnections', action: `paged${buildPaginationQuery(req)}` });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'IntegrationConnections', action: `${id}` });
    }

    getByIntegration(integrationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationConnections', action: `by-integration/${integrationId}` });
    }

    getByType(connectionTypeId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationConnections', action: `by-type/${connectionTypeId}` });
    }

    create(request: CreateIntegrationConnectionRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationConnections' }, request);
    }

    update(id: string, request: UpdateIntegrationConnectionRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationConnections', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationConnections', action: `delete/${id}` }, {});
    }
}

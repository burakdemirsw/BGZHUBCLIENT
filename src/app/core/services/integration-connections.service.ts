import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    IntegrationConnectionResponse,
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


    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<IntegrationConnectionResponse>>> {
        return this.http.get<PagedResult<IntegrationConnectionResponse>>({ controller: 'IntegrationConnections', action: `paged${buildPaginationQuery(req)}` });
    }

    getById(id: string): Promise<ApiResponse<IntegrationConnectionResponse>> {
        return this.http.get<IntegrationConnectionResponse>({ controller: 'IntegrationConnections', action: `${id}` });
    }

    getByIntegrationUser(integrationUserId: string): Promise<ApiResponse<IntegrationConnectionResponse[]>> {
        return this.http.get<IntegrationConnectionResponse[]>({ controller: 'IntegrationConnections', action: `by-integration-user/${integrationUserId}` });
    }

    getByType(connectionTypeId: string): Promise<ApiResponse<IntegrationConnectionResponse[]>> {
        return this.http.get<IntegrationConnectionResponse[]>({ controller: 'IntegrationConnections', action: `by-type/${connectionTypeId}` });
    }

    create(request: CreateIntegrationConnectionRequest): Promise<ApiResponse<IntegrationConnectionResponse>> {
        return this.http.post<IntegrationConnectionResponse>({ controller: 'IntegrationConnections' }, request);
    }

    update(id: string, request: UpdateIntegrationConnectionRequest): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: 'IntegrationConnections', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: 'IntegrationConnections', action: `delete/${id}` }, {});
    }
}

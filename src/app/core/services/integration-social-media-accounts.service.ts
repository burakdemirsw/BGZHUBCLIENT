import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateIntegrationSocialMediaAccountRequest,
    UpdateIntegrationSocialMediaAccountRequest,
} from '../models/integration/integration-social-media-account.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class IntegrationSocialMediaAccountsService {
    constructor(private http: HttpClientService) {}

    getAll(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'IntegrationSocialMediaAccounts', action: buildPaginationQuery(req) });
    }

    getByCompany(companyId: string, req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'IntegrationSocialMediaAccounts', action: `by-company/${companyId}${buildPaginationQuery(req)}` });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'IntegrationSocialMediaAccounts', action: `${id}` });
    }

    getByIntegration(integrationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationSocialMediaAccounts', action: `by-integration/${integrationId}` });
    }

    getBySocialMedia(socialMediaAccountId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationSocialMediaAccounts', action: `by-social-media/${socialMediaAccountId}` });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'IntegrationSocialMediaAccounts', action: `by-user/${userId}` });
    }

    create(request: CreateIntegrationSocialMediaAccountRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationSocialMediaAccounts' }, request);
    }

    update(id: string, request: UpdateIntegrationSocialMediaAccountRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationSocialMediaAccounts', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'IntegrationSocialMediaAccounts', action: `delete/${id}` }, {});
    }
}

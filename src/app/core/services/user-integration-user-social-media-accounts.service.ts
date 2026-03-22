import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateUserIntegrationUserSocialMediaAccountRequest,
    UpdateUserIntegrationUserSocialMediaAccountRequest,
} from '../models/integration/user-integration-user-social-media-account.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class UserIntegrationUserSocialMediaAccountsService {
    private readonly controller = 'UserIntegrationUserSocialMediaAccounts';

    constructor(private http: HttpClientService) {}

    getAll(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: this.controller, action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: this.controller, action: `${id}` });
    }

    getByIntegrationUser(integrationUserId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: this.controller, action: `by-integration-user/${integrationUserId}` });
    }

    getBySocialMediaAccount(socialMediaAccountId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: this.controller, action: `by-social-media-account/${socialMediaAccountId}` });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: this.controller, action: `by-user/${userId}` });
    }

    getByCompany(companyId: string, req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: this.controller, action: `by-company/${companyId}${buildPaginationQuery(req)}` });
    }

    create(request: CreateUserIntegrationUserSocialMediaAccountRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller }, request);
    }

    update(id: string, request: UpdateUserIntegrationUserSocialMediaAccountRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `delete/${id}` }, {});
    }
}

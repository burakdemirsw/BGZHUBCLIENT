import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    UserIntegrationUserSocialMediaAccountResponse,
    CreateUserIntegrationUserSocialMediaAccountRequest,
    UpdateUserIntegrationUserSocialMediaAccountRequest,
} from '../models/integration/user-integration-user-social-media-account.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class UserIntegrationUserSocialMediaAccountsService {
    private readonly controller = 'UserIntegrationUserSocialMediaAccounts';

    constructor(private http: HttpClientService) {}

    getAll(req?: PaginationRequest): Promise<ApiResponse<PagedResult<UserIntegrationUserSocialMediaAccountResponse>>> {
        return this.http.post<PagedResult<UserIntegrationUserSocialMediaAccountResponse>>(
            { controller: this.controller, action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<UserIntegrationUserSocialMediaAccountResponse>> {
        return this.http.get<UserIntegrationUserSocialMediaAccountResponse>({ controller: this.controller, action: `${id}` });
    }

    getByIntegrationUser(integrationUserId: string): Promise<ApiResponse<UserIntegrationUserSocialMediaAccountResponse[]>> {
        return this.http.get<UserIntegrationUserSocialMediaAccountResponse[]>({ controller: this.controller, action: `by-integration-user/${integrationUserId}` });
    }

    getBySocialMediaAccount(socialMediaAccountId: string): Promise<ApiResponse<UserIntegrationUserSocialMediaAccountResponse[]>> {
        return this.http.get<UserIntegrationUserSocialMediaAccountResponse[]>({ controller: this.controller, action: `by-social-media-account/${socialMediaAccountId}` });
    }

    getByUser(userId: string): Promise<ApiResponse<UserIntegrationUserSocialMediaAccountResponse[]>> {
        return this.http.get<UserIntegrationUserSocialMediaAccountResponse[]>({ controller: this.controller, action: `by-user/${userId}` });
    }

    getByCompany(companyId: string, req?: PaginationRequest): Promise<ApiResponse<PagedResult<UserIntegrationUserSocialMediaAccountResponse>>> {
        return this.http.post<PagedResult<UserIntegrationUserSocialMediaAccountResponse>>(
            { controller: this.controller, action: 'by-company/paged' },
            buildPaginationRequest({ ...req, companyId }),
        );
    }

    create(request: CreateUserIntegrationUserSocialMediaAccountRequest): Promise<ApiResponse<UserIntegrationUserSocialMediaAccountResponse>> {
        return this.http.post<UserIntegrationUserSocialMediaAccountResponse>({ controller: this.controller }, request);
    }

    update(id: string, request: UpdateUserIntegrationUserSocialMediaAccountRequest): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: this.controller, action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<unknown>> {
        return this.http.post<unknown>({ controller: this.controller, action: `delete/${id}` }, {});
    }
}

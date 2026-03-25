import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { CreateSubscriptionUsageRequest, SubscriptionUsageResponse, UpdateSubscriptionUsageRequest } from '../models/subscription-usage/subscription-usage.models';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionUsagesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<SubscriptionUsageResponse>>> {
        return this.http.post<PagedResult<SubscriptionUsageResponse>>(
            { controller: 'SubscriptionUsages', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<SubscriptionUsageResponse>> {
        return this.http.get<SubscriptionUsageResponse>({ controller: 'SubscriptionUsages', action: id });
    }

    getCurrentByCompany(companyId: string): Promise<ApiResponse<SubscriptionUsageResponse>> {
        return this.http.get<SubscriptionUsageResponse>({ controller: 'SubscriptionUsages', action: `company/${companyId}/current` });
    }

    create(request: CreateSubscriptionUsageRequest): Promise<ApiResponse<SubscriptionUsageResponse>> {
        return this.http.post<SubscriptionUsageResponse>({ controller: 'SubscriptionUsages' }, request);
    }

    update(id: string, request: UpdateSubscriptionUsageRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'SubscriptionUsages', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'SubscriptionUsages', action: `delete/${id}` }, {});
    }
}

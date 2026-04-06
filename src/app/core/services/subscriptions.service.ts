import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { ChangeSubscriptionRequest, CompanySubscriptionDetailResponse, CreateSubscriptionRequest, SubscriptionResponse, UpdateSubscriptionRequest } from '../models/subscription/subscription.models';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<SubscriptionResponse>>> {
        return this.http.post<PagedResult<SubscriptionResponse>>(
            { controller: 'Subscriptions', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<SubscriptionResponse>> {
        return this.http.get<SubscriptionResponse>({ controller: 'Subscriptions', action: id });
    }

    getActiveByCompany(companyId: string): Promise<ApiResponse<SubscriptionResponse>> {
        return this.http.get<SubscriptionResponse>({ controller: 'Subscriptions', action: `company/${companyId}/active` });
    }

    getCompanyDetail(companyId: string): Promise<ApiResponse<CompanySubscriptionDetailResponse>> {
        return this.http.get<CompanySubscriptionDetailResponse>({ controller: 'Subscriptions', action: `company/${companyId}/detail` });
    }

    create(request: CreateSubscriptionRequest): Promise<ApiResponse<SubscriptionResponse>> {
        return this.http.post<SubscriptionResponse>({ controller: 'Subscriptions' }, request);
    }

    update(id: string, request: UpdateSubscriptionRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Subscriptions', action: `update/${id}` }, request);
    }

    cancel(id: string, cancelledUserId?: string): Promise<ApiResponse<any>> {
        let qs = '';
        if (cancelledUserId) qs = `cancelledUserId=${cancelledUserId}`;
        return this.http.post<any>({ controller: 'Subscriptions', action: `cancel/${id}`, queryString: qs || undefined }, {});
    }

    changeSubscription(request: ChangeSubscriptionRequest): Promise<ApiResponse<SubscriptionResponse>> {
        return this.http.post<SubscriptionResponse>({ controller: 'Subscriptions', action: 'change-subscription' }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Subscriptions', action: `delete/${id}` }, {});
    }
}

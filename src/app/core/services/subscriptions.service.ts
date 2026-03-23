import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateSubscriptionRequest, SubscriptionResponse, UpdateSubscriptionRequest } from '../models/subscription/subscription.models';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionsService {
    constructor(private http: HttpClientService) {}

    getAll(params?: {
        companyId?: string;
        pageNumber?: number;
        pageSize?: number;
        searchTerm?: string;
        sortBy?: string;
        sortDescending?: boolean;
    }): Promise<ApiResponse<any>> {
        let qs = '';
        if (params) {
            const parts: string[] = [];
            if (params.companyId) parts.push(`CompanyId=${params.companyId}`);
            if (params.pageNumber != null) parts.push(`PageNumber=${params.pageNumber}`);
            if (params.pageSize != null) parts.push(`PageSize=${params.pageSize}`);
            if (params.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
            if (params.sortBy) parts.push(`SortBy=${encodeURIComponent(params.sortBy)}`);
            if (params.sortDescending != null) parts.push(`SortDescending=${params.sortDescending}`);
            qs = parts.join('&');
        }
        return this.http.get<any>({ controller: 'Subscriptions', queryString: qs || undefined });
    }

    getById(id: string): Promise<ApiResponse<SubscriptionResponse>> {
        return this.http.get<SubscriptionResponse>({ controller: 'Subscriptions', action: id });
    }

    getActiveByCompany(companyId: string): Promise<ApiResponse<SubscriptionResponse>> {
        return this.http.get<SubscriptionResponse>({ controller: 'Subscriptions', action: `company/${companyId}/active` });
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

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Subscriptions', action: `delete/${id}` }, {});
    }
}

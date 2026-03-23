import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateSubscriptionUsageRequest, SubscriptionUsageResponse, UpdateSubscriptionUsageRequest } from '../models/subscription-usage/subscription-usage.models';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionUsagesService {
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
        return this.http.get<any>({ controller: 'SubscriptionUsages', queryString: qs || undefined });
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

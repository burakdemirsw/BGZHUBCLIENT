import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateSubscriptionPaymentRequest, SubscriptionPaymentResponse } from '../models/subscription-payment/subscription-payment.models';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionPaymentsService {
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
        return this.http.get<any>({ controller: 'SubscriptionPayments', queryString: qs || undefined });
    }

    getById(id: string): Promise<ApiResponse<SubscriptionPaymentResponse>> {
        return this.http.get<SubscriptionPaymentResponse>({ controller: 'SubscriptionPayments', action: id });
    }

    create(request: CreateSubscriptionPaymentRequest): Promise<ApiResponse<SubscriptionPaymentResponse>> {
        return this.http.post<SubscriptionPaymentResponse>({ controller: 'SubscriptionPayments' }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'SubscriptionPayments', action: `delete/${id}` }, {});
    }
}

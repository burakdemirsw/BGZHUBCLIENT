import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { CreateSubscriptionPaymentRequest, SubscriptionPaymentResponse } from '../models/subscription-payment/subscription-payment.models';

@Injectable({
    providedIn: 'root',
})
export class SubscriptionPaymentsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<SubscriptionPaymentResponse>>> {
        return this.http.post<PagedResult<SubscriptionPaymentResponse>>(
            { controller: 'SubscriptionPayments', action: 'paged' },
            buildPaginationRequest(req),
        );
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

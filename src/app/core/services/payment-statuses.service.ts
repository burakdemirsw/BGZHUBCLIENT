import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreatePaymentStatusRequest, UpdatePaymentStatusRequest } from '../models/payment-status/payment-status.models';

@Injectable({ providedIn: 'root' })
export class PaymentStatusesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'PaymentStatuses' });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'PaymentStatuses', action: `${id}` });
    }

    create(request: CreatePaymentStatusRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'PaymentStatuses' }, request);
    }

    update(id: string, request: UpdatePaymentStatusRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'PaymentStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'PaymentStatuses', action: `delete/${id}` }, {});
    }
}

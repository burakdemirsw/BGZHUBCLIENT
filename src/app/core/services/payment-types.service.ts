import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreatePaymentTypeRequest, UpdatePaymentTypeRequest } from '../models/payment-type/payment-type.models';

@Injectable({ providedIn: 'root' })
export class PaymentTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'PaymentTypes' });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'PaymentTypes', action: `${id}` });
    }

    create(request: CreatePaymentTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'PaymentTypes' }, request);
    }

    update(id: string, request: UpdatePaymentTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'PaymentTypes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'PaymentTypes', action: `delete/${id}` }, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePaymentStatusRequest, UpdatePaymentStatusRequest } from '../models/payment-status/payment-status.models';

@Injectable({ providedIn: 'root' })
export class PaymentStatusesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'PaymentStatuses' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'PaymentStatuses', action: `${id}` });
    }

    create(request: CreatePaymentStatusRequest): Promise<any> {
        return this.http.post({ controller: 'PaymentStatuses' }, request);
    }

    update(id: string, request: UpdatePaymentStatusRequest): Promise<any> {
        return this.http.post({ controller: 'PaymentStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'PaymentStatuses', action: `delete/${id}` }, {});
    }
}

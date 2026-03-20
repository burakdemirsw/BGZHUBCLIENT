import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePaymentTypeRequest, UpdatePaymentTypeRequest } from '../models/payment-type/payment-type.models';

@Injectable({ providedIn: 'root' })
export class PaymentTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'PaymentTypes' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'PaymentTypes', action: `${id}` });
    }

    create(request: CreatePaymentTypeRequest): Promise<any> {
        return this.http.post({ controller: 'PaymentTypes' }, request);
    }

    update(id: string, request: UpdatePaymentTypeRequest): Promise<any> {
        return this.http.post({ controller: 'PaymentTypes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'PaymentTypes', action: `delete/${id}` }, {});
    }
}

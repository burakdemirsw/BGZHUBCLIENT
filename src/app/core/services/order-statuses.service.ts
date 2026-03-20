import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateOrderStatusRequest, UpdateOrderStatusRequest } from '../models/order-status/order-status.models';

@Injectable({ providedIn: 'root' })
export class OrderStatusesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'OrderStatuses' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'OrderStatuses', action: `${id}` });
    }

    create(request: CreateOrderStatusRequest): Promise<any> {
        return this.http.post({ controller: 'OrderStatuses' }, request);
    }

    update(id: string, request: UpdateOrderStatusRequest): Promise<any> {
        return this.http.post({ controller: 'OrderStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'OrderStatuses', action: `delete/${id}` }, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateOrderStatusRequest, UpdateOrderStatusRequest } from '../models/order-status/order-status.models';

@Injectable({ providedIn: 'root' })
export class OrderStatusesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'OrderStatuses' });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'OrderStatuses', action: `${id}` });
    }

    create(request: CreateOrderStatusRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'OrderStatuses' }, request);
    }

    update(id: string, request: UpdateOrderStatusRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'OrderStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'OrderStatuses', action: `delete/${id}` }, {});
    }
}

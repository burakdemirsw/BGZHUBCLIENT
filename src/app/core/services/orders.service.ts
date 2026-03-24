import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { 
    OrderWithCustomerResponse,
    CreateOrderRequest, 
    UpdateOrderRequest, 
    CreateOrderPaymentRequest,
    UpdateOrderPaymentRequest,
    OrderFilterRequest 
} from '../models/order/order.models';
import { PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
    constructor(private http: HttpClientService) {}

    // ── Orders ──
    getAll(): Promise<ApiResponse<OrderWithCustomerResponse[]>> {
        return this.http.get<OrderWithCustomerResponse[]>({ controller: 'Orders' });
    }

    getById(id: string): Promise<ApiResponse<OrderWithCustomerResponse>> {
        return this.http.get<OrderWithCustomerResponse>({ controller: 'Orders', action: `${id}` });
    }

    getByCompany(companyId: string): Promise<ApiResponse<OrderWithCustomerResponse[]>> {
        return this.http.get<OrderWithCustomerResponse[]>({ controller: 'Orders', action: `company/${companyId}` });
    }

    getByCompanyPaged(filter: OrderFilterRequest): Promise<ApiResponse<PagedResult<OrderWithCustomerResponse>>> {
        return this.http.post<PagedResult<OrderWithCustomerResponse>>({ controller: 'Orders', action: 'company/paged' }, filter);
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Orders', action: `user/${userId}` });
    }

    getByCustomer(customerId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Orders', action: `customer/${customerId}` });
    }

    getByIntegrationUser(integrationUserId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Orders', action: `integration-user/${integrationUserId}` });
    }

    getByStatus(statusId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Orders', action: `status/${statusId}` });
    }

    create(request: CreateOrderRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Orders' }, request);
    }

    update(id: string, request: UpdateOrderRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Orders', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Orders', action: `delete/${id}` }, {});
    }

    // ── Order Payments ──
    getPaymentsByOrder(orderId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'OrderPayments', action: `order/${orderId}` });
    }

    getPaymentById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'OrderPayments', action: `${id}` });
    }

    createPayment(request: CreateOrderPaymentRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'OrderPayments' }, request);
    }

    updatePayment(id: string, request: UpdateOrderPaymentRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'OrderPayments', action: `update/${id}` }, request);
    }

    deletePayment(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'OrderPayments', action: `delete/${id}` }, {});
    }
}

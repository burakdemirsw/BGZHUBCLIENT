import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { 
    CreateOrderRequest, 
    UpdateOrderRequest, 
    CreateOrderPaymentRequest,
    UpdateOrderPaymentRequest,
    OrderFilterRequest 
} from '../models/order/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
    constructor(private http: HttpClientService) {}

    // ── Orders ──
    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'Orders' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Orders', action: `${id}` });
    }

    getByCompany(companyId: string): Promise<any> {
        return this.http.get_new({ controller: 'Orders', action: `company/${companyId}` });
    }

    getByCompanyPaged(companyId: string, filter?: OrderFilterRequest): Promise<any> {
        const parts: string[] = [];
        if (filter) {
            if (filter.pageNumber != null) parts.push(`PageNumber=${filter.pageNumber}`);
            if (filter.pageSize != null) parts.push(`PageSize=${filter.pageSize}`);
            if (filter.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(filter.searchTerm)}`);
            if (filter.orderStatusId) parts.push(`OrderStatusId=${filter.orderStatusId}`);
            if (filter.paymentTypeId) parts.push(`PaymentTypeId=${filter.paymentTypeId}`);
            if (filter.customerId) parts.push(`CustomerId=${filter.customerId}`);
            if (filter.userId) parts.push(`UserId=${filter.userId}`);
            if (filter.startDate) parts.push(`StartDate=${filter.startDate}`);
            if (filter.endDate) parts.push(`EndDate=${filter.endDate}`);
            if (filter.isCompleted != null) parts.push(`IsCompleted=${filter.isCompleted}`);
            if (filter.isCancel != null) parts.push(`IsCancel=${filter.isCancel}`);
            if (filter.sortBy) parts.push(`SortBy=${encodeURIComponent(filter.sortBy)}`);
            if (filter.sortDescending != null) parts.push(`SortDescending=${filter.sortDescending}`);
        }
        const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
        return this.http.get_new({ controller: 'Orders', action: `company/${companyId}/paged${qs}` });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'Orders', action: `user/${userId}` });
    }

    getByCustomer(customerId: string): Promise<any> {
        return this.http.get_new({ controller: 'Orders', action: `customer/${customerId}` });
    }

    getByIntegrationUser(integrationUserId: string): Promise<any> {
        return this.http.get_new({ controller: 'Orders', action: `integration-user/${integrationUserId}` });
    }

    getByStatus(statusId: string): Promise<any> {
        return this.http.get_new({ controller: 'Orders', action: `status/${statusId}` });
    }

    create(request: CreateOrderRequest): Promise<any> {
        return this.http.post({ controller: 'Orders' }, request);
    }

    update(id: string, request: UpdateOrderRequest): Promise<any> {
        return this.http.post({ controller: 'Orders', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Orders', action: `delete/${id}` }, {});
    }

    // ── Order Payments ──
    getPaymentsByOrder(orderId: string): Promise<any> {
        return this.http.get_new({ controller: 'OrderPayments', action: `order/${orderId}` });
    }

    getPaymentById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'OrderPayments', action: `${id}` });
    }

    createPayment(request: CreateOrderPaymentRequest): Promise<any> {
        return this.http.post({ controller: 'OrderPayments' }, request);
    }

    updatePayment(id: string, request: UpdateOrderPaymentRequest): Promise<any> {
        return this.http.post({ controller: 'OrderPayments', action: `update/${id}` }, request);
    }

    deletePayment(id: string): Promise<any> {
        return this.http.post({ controller: 'OrderPayments', action: `delete/${id}` }, {});
    }
}

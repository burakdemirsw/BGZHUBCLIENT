import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerAddressRequest, UpdateCustomerAddressRequest } from '../models/customer/customer-address.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerAddressesService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({
      controller: 'CustomerAddresses',
      action: buildPaginationQuery(req)
    });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'CustomerAddresses', action: `${id}` });
  }

  getByCustomerId(customerId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'CustomerAddresses', action: `by-customer/${customerId}` });
  }

  create(request: CreateCustomerAddressRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerAddresses' }, request);
  }

  update(id: string, request: UpdateCustomerAddressRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerAddresses', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerAddresses', action: `delete/${id}` }, {});
  }
}

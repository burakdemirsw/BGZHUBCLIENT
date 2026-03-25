import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerDescriptionRequest, UpdateCustomerDescriptionRequest } from '../models/customer/customer-description.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerDescriptionsService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'CustomerDescriptions', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'CustomerDescriptions', action: `${id}` });
  }

  getByCustomerId(customerId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'CustomerDescriptions', action: `by-customer/${customerId}` });
  }

  create(request: CreateCustomerDescriptionRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerDescriptions' }, request);
  }

  update(id: string, request: UpdateCustomerDescriptionRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerDescriptions', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerDescriptions', action: `delete/${id}` }, {});
  }
}

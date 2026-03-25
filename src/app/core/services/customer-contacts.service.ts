import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerContactRequest, UpdateCustomerContactRequest } from '../models/customer/customer-contact.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerContactsService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'CustomerContacts', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'CustomerContacts', action: `${id}` });
  }

  getByCustomerId(customerId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'CustomerContacts', action: `by-customer/${customerId}` });
  }

  create(request: CreateCustomerContactRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerContacts' }, request);
  }

  update(id: string, request: UpdateCustomerContactRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerContacts', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerContacts', action: `delete/${id}` }, {});
  }
}

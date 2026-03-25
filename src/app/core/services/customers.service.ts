import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerRequest, UpdateCustomerRequest, CustomerDetailResponse } from '../models/customer/customer.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<CustomerDetailResponse>>> {
    return this.http.post<PagedResult<CustomerDetailResponse>>(
      { controller: 'Customers', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<CustomerDetailResponse>> {
    return this.http.get<CustomerDetailResponse>({ controller: 'Customers', action: `${id}` });
  }

  getByUserId(userId: string): Promise<ApiResponse<CustomerDetailResponse[]>> {
    return this.http.get<CustomerDetailResponse[]>({ controller: 'Customers', action: `by-user/${userId}` });
  }

  getByAccountId(accountId: string): Promise<ApiResponse<CustomerDetailResponse>> {
    return this.http.get<CustomerDetailResponse>({ controller: 'Customers', action: `by-account/${accountId}` });
  }

  /** Şirkete ait müşterileri sayfalanmış ve filtrelenmiş olarak getirir */
  getByCompany(companyId: string, req?: PaginationRequest): Promise<ApiResponse<PagedResult<CustomerDetailResponse>>> {
    return this.http.post<PagedResult<CustomerDetailResponse>>(
      { controller: 'Customers', action: 'by-company/paged' },
      buildPaginationRequest({ ...req, companyId }),
    );
  }

  create(request: CreateCustomerRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Customers' }, request);
  }

  update(id: string, request: UpdateCustomerRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Customers', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Customers', action: `delete/${id}` }, {});
  }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../models/customer/customer.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({
      controller: 'Customers',
      action: buildPaginationQuery(req)
    });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Customers', action: `${id}` });
  }

  getByUserId(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Customers', action: `by-user/${userId}` });
  }

  getByAccountId(accountId: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Customers', action: `by-account/${accountId}` });
  }

  /** Şirkete ait müşterileri sayfalanmış ve filtrelenmiş olarak getirir */
  getByCompany(companyId: string, params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    platformName?: string;
    status?: number;
    isBlocked?: boolean;
    userId?: string;
    socialMediaAccountId?: string;
    sortBy?: string;
    sortDescending?: boolean;
  }): Promise<ApiResponse<any>> {
    const parts: string[] = [];
    if (params) {
      if (params.pageNumber != null) parts.push(`PageNumber=${params.pageNumber}`);
      if (params.pageSize != null) parts.push(`PageSize=${params.pageSize}`);
      if (params.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
      if (params.platformName) parts.push(`PlatformName=${encodeURIComponent(params.platformName)}`);
      if (params.status != null) parts.push(`Status=${params.status}`);
      if (params.isBlocked != null) parts.push(`IsBlocked=${params.isBlocked}`);
      if (params.userId) parts.push(`UserId=${params.userId}`);
      if (params.socialMediaAccountId) parts.push(`SocialMediaAccountId=${params.socialMediaAccountId}`);
      if (params.sortBy) parts.push(`SortBy=${encodeURIComponent(params.sortBy)}`);
      if (params.sortDescending != null) parts.push(`SortDescending=${params.sortDescending}`);
    }
    const qs = parts.length > 0 ? `?${parts.join('&')}` : '';
    return this.http.get<any>({ controller: 'Customers', action: `by-company/${companyId}${qs}` });
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

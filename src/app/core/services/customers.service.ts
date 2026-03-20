import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerRequest, UpdateCustomerRequest } from '../models/customer/customer.models';

@Injectable({
  providedIn: 'root',
})
export class CustomersService {
  constructor(private http: HttpClientService) {}

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    return this.http.get_new({
      controller: 'Customers',
      action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
    });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Customers', action: `${id}` });
  }

  getByUserId(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Customers', action: `by-user/${userId}` });
  }

  getByAccountId(accountId: string): Promise<any> {
    return this.http.get_new({ controller: 'Customers', action: `by-account/${accountId}` });
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
  }): Promise<any> {
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
    return this.http.get_new({ controller: 'Customers', action: `by-company/${companyId}${qs}` });
  }

  create(request: CreateCustomerRequest): Promise<any> {
    return this.http.post({ controller: 'Customers' }, request);
  }

  update(id: string, request: UpdateCustomerRequest): Promise<any> {
    return this.http.post({ controller: 'Customers', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Customers', action: `delete/${id}` }, {});
  }
}

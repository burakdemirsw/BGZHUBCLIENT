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

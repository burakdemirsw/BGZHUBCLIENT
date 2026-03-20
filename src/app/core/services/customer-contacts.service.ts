import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerContactRequest, UpdateCustomerContactRequest } from '../models/customer/customer-contact.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerContactsService {
  constructor(private http: HttpClientService) {}

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    return this.http.get_new({
      controller: 'CustomerContacts',
      action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
    });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerContacts', action: `${id}` });
  }

  getByCustomerId(customerId: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerContacts', action: `by-customer/${customerId}` });
  }

  create(request: CreateCustomerContactRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerContacts' }, request);
  }

  update(id: string, request: UpdateCustomerContactRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerContacts', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'CustomerContacts', action: `delete/${id}` }, {});
  }
}

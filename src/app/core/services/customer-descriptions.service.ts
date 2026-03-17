import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerDescriptionRequest, UpdateCustomerDescriptionRequest } from '../models/customer/customer-description.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerDescriptionsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'CustomerDescriptions' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerDescriptions', action: `${id}` });
  }

  getByCustomerId(customerId: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerDescriptions', action: `by-customer/${customerId}` });
  }

  create(request: CreateCustomerDescriptionRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerDescriptions' }, request);
  }

  update(id: string, request: UpdateCustomerDescriptionRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerDescriptions', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'CustomerDescriptions', action: `delete/${id}` }, {});
  }
}

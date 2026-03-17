import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerAddressRequest, UpdateCustomerAddressRequest } from '../models/customer/customer-address.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerAddressesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'CustomerAddresses' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerAddresses', action: `${id}` });
  }

  getByCustomerId(customerId: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerAddresses', action: `by-customer/${customerId}` });
  }

  create(request: CreateCustomerAddressRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerAddresses' }, request);
  }

  update(id: string, request: UpdateCustomerAddressRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerAddresses', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'CustomerAddresses', action: `delete/${id}` }, {});
  }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerTypeRequest, UpdateCustomerTypeRequest } from '../models/customer/customer-type.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerTypesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'CustomerTypes' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'CustomerTypes', action: `${id}` });
  }

  create(request: CreateCustomerTypeRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerTypes' }, request);
  }

  update(id: string, request: UpdateCustomerTypeRequest): Promise<any> {
    return this.http.post({ controller: 'CustomerTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'CustomerTypes', action: `delete/${id}` }, {});
  }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerTypeRequest, UpdateCustomerTypeRequest } from '../models/customer/customer-type.models';

@Injectable({
  providedIn: 'root',
})
export class CustomerTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    return this.http.get_new({
      controller: 'CustomerTypes',
      action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
    });
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

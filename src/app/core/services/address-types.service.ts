import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateAddressTypeRequest, UpdateAddressTypeRequest } from '../models/customer/address-type.models';

@Injectable({
  providedIn: 'root',
})
export class AddressTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    return this.http.get_new({
      controller: 'AddressTypes',
      action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
    });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'AddressTypes', action: `${id}` });
  }

  create(request: CreateAddressTypeRequest): Promise<any> {
    return this.http.post({ controller: 'AddressTypes' }, request);
  }

  update(id: string, request: UpdateAddressTypeRequest): Promise<any> {
    return this.http.post({ controller: 'AddressTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'AddressTypes', action: `delete/${id}` }, {});
  }
}

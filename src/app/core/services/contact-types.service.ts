import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateContactTypeRequest, UpdateContactTypeRequest } from '../models/customer/contact-type.models';

@Injectable({
  providedIn: 'root',
})
export class ContactTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    return this.http.get_new({
      controller: 'ContactTypes',
      action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
    });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'ContactTypes', action: `${id}` });
  }

  create(request: CreateContactTypeRequest): Promise<any> {
    return this.http.post({ controller: 'ContactTypes' }, request);
  }

  update(id: string, request: UpdateContactTypeRequest): Promise<any> {
    return this.http.post({ controller: 'ContactTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'ContactTypes', action: `delete/${id}` }, {});
  }
}

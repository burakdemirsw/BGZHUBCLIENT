import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateContactTypeRequest, UpdateContactTypeRequest } from '../models/customer/contact-type.models';

@Injectable({
  providedIn: 'root',
})
export class ContactTypesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'ContactTypes' });
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

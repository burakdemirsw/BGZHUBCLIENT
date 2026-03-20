import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateUserTypeRequest, UpdateUserTypeRequest } from '../models/user/user-type.models';

@Injectable({
  providedIn: 'root',
})
export class UserTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    return this.http.get_new({
      controller: 'UserTypes',
      action: `?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
    });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'UserTypes', action: `${id}` });
  }

  create(request: CreateUserTypeRequest): Promise<any> {
    return this.http.post({ controller: 'UserTypes' }, request);
  }

  update(id: string, request: UpdateUserTypeRequest): Promise<any> {
    return this.http.post({ controller: 'UserTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'UserTypes', action: `delete/${id}` }, {});
  }
}

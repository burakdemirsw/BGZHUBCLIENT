import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateUserTypeRequest, UpdateUserTypeRequest } from '../models/user/user-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class UserTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({
      controller: 'UserTypes',
      action: buildPaginationQuery(req)
    });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'UserTypes', action: `${id}` });
  }

  create(request: CreateUserTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'UserTypes' }, request);
  }

  update(id: string, request: UpdateUserTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'UserTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'UserTypes', action: `delete/${id}` }, {});
  }
}

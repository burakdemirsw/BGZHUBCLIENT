import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateUserRequest, UpdateUserRequest } from '../models/user/user.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(private http: HttpClientService) {}

  getAll(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'Users', action: buildPaginationQuery(req) });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Users' }, id);
  }

  create(request: CreateUserRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Users' }, request);
  }

  update(id: string, request: UpdateUserRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Users', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Users', action: `delete/${id}` }, {});
  }
}

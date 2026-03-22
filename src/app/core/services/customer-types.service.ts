import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCustomerTypeRequest, UpdateCustomerTypeRequest } from '../models/customer/customer-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({
      controller: 'CustomerTypes',
      action: buildPaginationQuery(req)
    });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'CustomerTypes', action: `${id}` });
  }

  create(request: CreateCustomerTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerTypes' }, request);
  }

  update(id: string, request: UpdateCustomerTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CustomerTypes', action: `delete/${id}` }, {});
  }
}

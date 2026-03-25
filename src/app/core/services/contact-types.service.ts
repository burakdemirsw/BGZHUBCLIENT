import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateContactTypeRequest, UpdateContactTypeRequest } from '../models/customer/contact-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class ContactTypesService {
  constructor(private http: HttpClientService) {}

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'ContactTypes', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'ContactTypes', action: `${id}` });
  }

  create(request: CreateContactTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ContactTypes' }, request);
  }

  update(id: string, request: UpdateContactTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ContactTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'ContactTypes', action: `delete/${id}` }, {});
  }
}

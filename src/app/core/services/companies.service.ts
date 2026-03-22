import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateCompanyRequest, UpdateCompanyRequest } from '../models/customer/company.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class CompaniesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Companies' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'Companies', action: buildPaginationQuery(req) });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Companies', action: `${id}` });
  }

  getByTaxNumber(taxNumber: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Companies', action: `tax/${taxNumber}` });
  }

  create(request: CreateCompanyRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Companies' }, request);
  }

  update(id: string, request: UpdateCompanyRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Companies', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Companies', action: `delete/${id}` }, {});
  }
}

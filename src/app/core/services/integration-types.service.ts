import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateIntegrationTypeRequest, UpdateIntegrationTypeRequest } from '../models/integration/integration-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class IntegrationTypesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'IntegrationTypes' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'IntegrationTypes', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'IntegrationTypes', action: `${id}` });
  }

  getByCode(code: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'IntegrationTypes', action: `code/${code}` });
  }

  create(request: CreateIntegrationTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'IntegrationTypes' }, request);
  }

  update(id: string, request: UpdateIntegrationTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'IntegrationTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'IntegrationTypes', action: `delete/${id}` }, {});
  }
}

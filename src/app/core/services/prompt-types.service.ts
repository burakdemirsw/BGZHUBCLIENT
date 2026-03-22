import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePromptTypeRequest, UpdatePromptTypeRequest } from '../models/ai-assistant/prompt.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class PromptTypesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'PromptTypes' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'PromptTypes', action: buildPaginationQuery(req) });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'PromptTypes', action: `${id}` });
  }

  create(request: CreatePromptTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'PromptTypes' }, request);
  }

  update(id: string, request: UpdatePromptTypeRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'PromptTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'PromptTypes', action: `delete/${id}` }, {});
  }
}

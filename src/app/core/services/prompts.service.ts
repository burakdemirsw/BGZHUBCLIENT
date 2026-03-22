import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePromptRequest, UpdatePromptRequest } from '../models/ai-assistant/prompt.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class PromptsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Prompts' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'Prompts', action: buildPaginationQuery(req) });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Prompts', action: `${id}` });
  }

  create(request: CreatePromptRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Prompts' }, request);
  }

  update(id: string, request: UpdatePromptRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Prompts', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Prompts', action: `delete/${id}` }, {});
  }
}

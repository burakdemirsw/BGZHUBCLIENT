import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePromptAiAssistantRequest, UpdatePromptAiAssistantRequest } from '../models/ai-assistant/prompt.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class PromptAiAssistantsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'PromptAiAssistants' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'PromptAiAssistants', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'PromptAiAssistants', action: `${id}` });
  }

  getByPrompt(promptId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'PromptAiAssistants', action: `by-prompt/${promptId}` });
  }

  getByAssistant(aiAssistantId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'PromptAiAssistants', action: `by-assistant/${aiAssistantId}` });
  }

  create(request: CreatePromptAiAssistantRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'PromptAiAssistants' }, request);
  }

  update(id: string, request: UpdatePromptAiAssistantRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'PromptAiAssistants', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'PromptAiAssistants', action: `delete/${id}` }, {});
  }
}

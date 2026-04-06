import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { CreateAiProviderRequest, UpdateAiProviderRequest } from '../models/ai-assistant/ai-provider.models';
import { CreateAiSettingRequest, UpdateAiSettingRequest } from '../models/ai-assistant/ai-setting.models';
import { CreateAiProviderSettingRequest, UpdateAiProviderSettingRequest } from '../models/ai-assistant/ai-provider-setting.models';
import { CreateAiModelRequest, UpdateAiModelRequest } from '../models/ai-assistant/ai-model.models';
import { AiAssistant, CreateAiAssistantRequest, UpdateAiAssistantRequest } from '../models/ai-assistant/ai-assistant.models';

@Injectable({
  providedIn: 'root',
})
export class AiProvidersService {
  constructor(private http: HttpClientService) {}

 
  getProvidersPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'AiProviders', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getProviderById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'AiProviders', action: id });
  }

  createProvider(request: CreateAiProviderRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiProviders' }, request);
  }

  updateProvider(id: string, request: UpdateAiProviderRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiProviders', action: `update/${id}` }, request);
  }

  deleteProvider(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiProviders', action: `delete/${id}` }, {});
  }

  // ── AiSettings ──
  getSettingsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'AiSettings', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getSettingById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'AiSettings', action: id });
  }

  createSetting(request: CreateAiSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiSettings' }, request);
  }

  updateSetting(id: string, request: UpdateAiSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiSettings', action: `update/${id}` }, request);
  }

  deleteSetting(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiSettings', action: `delete/${id}` }, {});
  }

  // ── AiProviderSettings ──
  getProviderSettingsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'AiProviderSettings', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getProviderSettingById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'AiProviderSettings', action: id });
  }

  getProviderSettingsByProvider(providerId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'AiProviderSettings', action: `by-provider/${providerId}` });
  }

  getProviderSettingsBySetting(settingId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'AiProviderSettings', action: `by-setting/${settingId}` });
  }

  createProviderSetting(request: CreateAiProviderSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiProviderSettings' }, request);
  }

  updateProviderSetting(id: string, request: UpdateAiProviderSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiProviderSettings', action: `update/${id}` }, request);
  }

  deleteProviderSetting(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiProviderSettings', action: `delete/${id}` }, {});
  }

  // ── AiModels ──
  getModelsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'AiModels', action: 'paged' },
      buildPaginationRequest(req),
    );
  }

  getModelById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'AiModels', action: id });
  }

  getModelsByProvider(providerId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'AiModels', action: `by-provider/${providerId}` });
  }

  getModelByCode(modelCode: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'AiModels', action: `by-code/${modelCode}` });
  }

  createModel(request: CreateAiModelRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiModels' }, request);
  }

  updateModel(id: string, request: UpdateAiModelRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiModels', action: `update/${id}` }, request);
  }

  deleteModel(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiModels', action: `delete/${id}` }, {});
  }

  // ── AiAssistants ──


  getAssistantsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<AiAssistant>>> {
    const body = buildPaginationRequest(req);
    return this.http.post<PagedResult<AiAssistant>>({ controller: 'AiAssistants', action: 'paged' }, body);
  }

  getAssistantById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'AiAssistants', action: id });
  }

  getAssistantsByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'AiAssistants', action: `by-user/${userId}` });
  }

  createAssistant(request: CreateAiAssistantRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiAssistants' }, request);
  }

  updateAssistant(id: string, request: UpdateAiAssistantRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiAssistants', action: `update/${id}` }, request);
  }

  deleteAssistant(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'AiAssistants', action: `delete/${id}` }, {});
  }

  // ── AiMessages ──
  getMessagesPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'Ai', action: 'messages/paged' },
      buildPaginationRequest(req),
    );
  }

  // ── AiKnowledge ──
  getKnowledge(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Ai', action: 'knowledge' });
  }

  getKnowledgePaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.post<PagedResult<any>>(
      { controller: 'Ai', action: 'knowledge/paged' },
      buildPaginationRequest(req),
    );
  }

  getKnowledgeById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Ai', action: `knowledge/${id}` });
  }

  getKnowledgeByAssistant(assistantId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Ai', action: `knowledge/by-assistant/${assistantId}` });
  }

  createKnowledge(request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Ai', action: 'knowledge' }, request);
  }

  updateKnowledge(id: string, request: any): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Ai', action: `update/knowledge/${id}` }, request);
  }

  deleteKnowledge(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Ai', action: `delete/knowledge/${id}` }, {});
  }
}

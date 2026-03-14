import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateAiProviderRequest, UpdateAiProviderRequest } from '../models/ai-assistant/ai-provider.models';
import { CreateAiSettingRequest, UpdateAiSettingRequest } from '../models/ai-assistant/ai-setting.models';
import { CreateAiProviderSettingRequest, UpdateAiProviderSettingRequest } from '../models/ai-assistant/ai-provider-setting.models';
import { CreateAiModelRequest, UpdateAiModelRequest } from '../models/ai-assistant/ai-model.models';
import { CreateAiAssistantRequest, UpdateAiAssistantRequest } from '../models/ai-assistant/ai-assistant.models';

@Injectable({
  providedIn: 'root',
})
export class AiProvidersService {
  constructor(private http: HttpClientService) {}

  // ── AiProviders ──
  getProviders(): Promise<any> {
    return this.http.get_new({ controller: 'AiProviders' });
  }

  getProviderById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'AiProviders', action: id });
  }

  createProvider(request: CreateAiProviderRequest): Promise<any> {
    return this.http.post({ controller: 'AiProviders' }, request);
  }

  updateProvider(id: string, request: UpdateAiProviderRequest): Promise<any> {
    return this.http.post({ controller: 'AiProviders', action: `update/${id}` }, request);
  }

  deleteProvider(id: string): Promise<any> {
    return this.http.post({ controller: 'AiProviders', action: `delete/${id}` }, {});
  }

  // ── AiSettings ──
  getSettings(): Promise<any> {
    return this.http.get_new({ controller: 'AiSettings' });
  }

  getSettingById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'AiSettings', action: id });
  }

  createSetting(request: CreateAiSettingRequest): Promise<any> {
    return this.http.post({ controller: 'AiSettings' }, request);
  }

  updateSetting(id: string, request: UpdateAiSettingRequest): Promise<any> {
    return this.http.post({ controller: 'AiSettings', action: `update/${id}` }, request);
  }

  deleteSetting(id: string): Promise<any> {
    return this.http.post({ controller: 'AiSettings', action: `delete/${id}` }, {});
  }

  // ── AiProviderSettings ──
  getProviderSettings(): Promise<any> {
    return this.http.get_new({ controller: 'AiProviderSettings' });
  }

  getProviderSettingById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'AiProviderSettings', action: id });
  }

  getProviderSettingsByProvider(providerId: string): Promise<any> {
    return this.http.get_new({ controller: 'AiProviderSettings', action: `by-provider/${providerId}` });
  }

  getProviderSettingsBySetting(settingId: string): Promise<any> {
    return this.http.get_new({ controller: 'AiProviderSettings', action: `by-setting/${settingId}` });
  }

  createProviderSetting(request: CreateAiProviderSettingRequest): Promise<any> {
    return this.http.post({ controller: 'AiProviderSettings' }, request);
  }

  updateProviderSetting(id: string, request: UpdateAiProviderSettingRequest): Promise<any> {
    return this.http.post({ controller: 'AiProviderSettings', action: `update/${id}` }, request);
  }

  deleteProviderSetting(id: string): Promise<any> {
    return this.http.post({ controller: 'AiProviderSettings', action: `delete/${id}` }, {});
  }

  // ── AiModels ──
  getModels(): Promise<any> {
    return this.http.get_new({ controller: 'AiModels' });
  }

  getModelById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'AiModels', action: id });
  }

  getModelsByProvider(providerId: string): Promise<any> {
    return this.http.get_new({ controller: 'AiModels', action: `by-provider/${providerId}` });
  }

  getModelByCode(modelCode: string): Promise<any> {
    return this.http.get_new({ controller: 'AiModels', action: `by-code/${modelCode}` });
  }

  createModel(request: CreateAiModelRequest): Promise<any> {
    return this.http.post({ controller: 'AiModels' }, request);
  }

  updateModel(id: string, request: UpdateAiModelRequest): Promise<any> {
    return this.http.post({ controller: 'AiModels', action: `update/${id}` }, request);
  }

  deleteModel(id: string): Promise<any> {
    return this.http.post({ controller: 'AiModels', action: `delete/${id}` }, {});
  }

  // ── AiAssistants ──
  getAssistants(): Promise<any> {
    return this.http.get_new({ controller: 'AiAssistants' });
  }

  getAssistantById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'AiAssistants', action: id });
  }

  getAssistantsByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'AiAssistants', action: `by-user/${userId}` });
  }

  createAssistant(request: CreateAiAssistantRequest): Promise<any> {
    return this.http.post({ controller: 'AiAssistants' }, request);
  }

  updateAssistant(id: string, request: UpdateAiAssistantRequest): Promise<any> {
    return this.http.post({ controller: 'AiAssistants', action: `update/${id}` }, request);
  }

  deleteAssistant(id: string): Promise<any> {
    return this.http.post({ controller: 'AiAssistants', action: `delete/${id}` }, {});
  }

  // ── AiKnowledge ──
  getKnowledge(): Promise<any> {
    return this.http.get_new({ controller: 'Ai', action: 'knowledge' });
  }

  getKnowledgeById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Ai', action: `knowledge/${id}` });
  }

  getKnowledgeByAssistant(assistantId: string): Promise<any> {
    return this.http.get_new({ controller: 'Ai', action: `knowledge/by-assistant/${assistantId}` });
  }

  createKnowledge(request: any): Promise<any> {
    return this.http.post({ controller: 'Ai', action: 'knowledge' }, request);
  }

  updateKnowledge(id: string, request: any): Promise<any> {
    return this.http.post({ controller: 'Ai', action: `update/knowledge/${id}` }, request);
  }

  deleteKnowledge(id: string): Promise<any> {
    return this.http.post({ controller: 'Ai', action: `delete/knowledge/${id}` }, {});
  }
}

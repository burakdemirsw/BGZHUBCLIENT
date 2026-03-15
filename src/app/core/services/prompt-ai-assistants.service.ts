import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePromptAiAssistantRequest, UpdatePromptAiAssistantRequest } from '../models/ai-assistant/prompt.models';

@Injectable({
  providedIn: 'root',
})
export class PromptAiAssistantsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'PromptAiAssistants' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'PromptAiAssistants', action: `${id}` });
  }

  getByPrompt(promptId: string): Promise<any> {
    return this.http.get_new({ controller: 'PromptAiAssistants', action: `by-prompt/${promptId}` });
  }

  getByAssistant(aiAssistantId: string): Promise<any> {
    return this.http.get_new({ controller: 'PromptAiAssistants', action: `by-assistant/${aiAssistantId}` });
  }

  create(request: CreatePromptAiAssistantRequest): Promise<any> {
    return this.http.post({ controller: 'PromptAiAssistants' }, request);
  }

  update(id: string, request: UpdatePromptAiAssistantRequest): Promise<any> {
    return this.http.post({ controller: 'PromptAiAssistants', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'PromptAiAssistants', action: `delete/${id}` }, {});
  }
}

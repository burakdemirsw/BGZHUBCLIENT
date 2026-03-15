import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePromptRequest, UpdatePromptRequest } from '../models/ai-assistant/prompt.models';

@Injectable({
  providedIn: 'root',
})
export class PromptsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Prompts' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Prompts', action: `${id}` });
  }

  create(request: CreatePromptRequest): Promise<any> {
    return this.http.post({ controller: 'Prompts' }, request);
  }

  update(id: string, request: UpdatePromptRequest): Promise<any> {
    return this.http.post({ controller: 'Prompts', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Prompts', action: `delete/${id}` }, {});
  }
}

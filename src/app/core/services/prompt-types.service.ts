import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreatePromptTypeRequest, UpdatePromptTypeRequest } from '../models/ai-assistant/prompt.models';

@Injectable({
  providedIn: 'root',
})
export class PromptTypesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'PromptTypes' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'PromptTypes', action: `${id}` });
  }

  create(request: CreatePromptTypeRequest): Promise<any> {
    return this.http.post({ controller: 'PromptTypes' }, request);
  }

  update(id: string, request: UpdatePromptTypeRequest): Promise<any> {
    return this.http.post({ controller: 'PromptTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'PromptTypes', action: `delete/${id}` }, {});
  }
}

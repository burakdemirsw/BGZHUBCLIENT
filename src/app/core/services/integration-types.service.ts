import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateIntegrationTypeRequest, UpdateIntegrationTypeRequest } from '../models/integration/integration-type.models';

@Injectable({
  providedIn: 'root',
})
export class IntegrationTypesService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'IntegrationTypes' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'IntegrationTypes', action: `${id}` });
  }

  getByCode(code: string): Promise<any> {
    return this.http.get_new({ controller: 'IntegrationTypes', action: `by-code/${code}` });
  }

  create(request: CreateIntegrationTypeRequest): Promise<any> {
    return this.http.post({ controller: 'IntegrationTypes' }, request);
  }

  update(id: string, request: UpdateIntegrationTypeRequest): Promise<any> {
    return this.http.post({ controller: 'IntegrationTypes', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'IntegrationTypes', action: `delete/${id}` }, {});
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { CreateIntegrationRequest, UpdateIntegrationRequest } from '../models/integration/integration.models';

@Injectable({
  providedIn: 'root',
})
export class IntegrationsService {
  constructor(private http: HttpClientService) {}

  getAll(): Observable<any> {
    return this.http.get_new({ controller: 'Integrations' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Integrations', action: `${id}` });
  }

  create(request: CreateIntegrationRequest): Observable<any> {
    return this.http.post({ controller: 'Integrations' }, request);
  }

  update(id: string, request: UpdateIntegrationRequest): Observable<any> {
    return this.http.post({ controller: 'Integrations', action: `update/${id}` }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.post({ controller: 'Integrations', action: `delete/${id}` }, {});
  }
}

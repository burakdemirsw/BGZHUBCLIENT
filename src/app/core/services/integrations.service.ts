import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateIntegrationRequest, UpdateIntegrationRequest } from '../models/integration/integration.models';
import { CreateIntegrationUserRequest, UpdateIntegrationUserRequest } from '../models/integration/integration-user.models';
import { CreateIntegrationPropertyRequest, UpdateIntegrationPropertyRequest } from '../models/integration/integration-property.models';

@Injectable({
  providedIn: 'root',
})
export class IntegrationsService {
  constructor(private http: HttpClientService) {}

  // ── Integrations ──
  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Integrations' });
  }

  getPaged(page: number = 1, pageSize: number = 1000): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `paged?page=${page}&pageSize=${pageSize}` });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `${id}` });
  }

  create(request: CreateIntegrationRequest): Promise<any> {
    return this.http.post({ controller: 'Integrations' }, request);
  }

  update(id: string, request: UpdateIntegrationRequest): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: `delete/${id}` }, {});
  }

  // ── Integration Users ──
  getIntegrationUsers(): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: 'users' });
  }

  getIntegrationUsersPaged(page: number = 1, pageSize: number = 10): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `users/paged?page=${page}&pageSize=${pageSize}` });
  }

  getIntegrationUserById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `users/${id}` });
  }

  getUsersByIntegration(integrationId: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `${integrationId}/users` });
  }

  getIntegrationsByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `users/by-user/${userId}` });
  }

  createIntegrationUser(request: CreateIntegrationUserRequest): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: 'users' }, request);
  }

  updateIntegrationUser(id: string, request: UpdateIntegrationUserRequest): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: `update/users/${id}` }, request);
  }

  deleteIntegrationUser(id: string): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: `delete/users/${id}` }, {});
  }

  // ── Integration Properties ──
  getIntegrationProperties(): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: 'properties' });
  }

  getIntegrationPropertyById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `properties/${id}` });
  }

  getPropertiesByIntegration(integrationId: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `${integrationId}/properties` });
  }

  getPropertiesByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'Integrations', action: `properties/by-user/${userId}` });
  }

  createIntegrationProperty(request: CreateIntegrationPropertyRequest): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: 'properties' }, request);
  }

  updateIntegrationProperty(id: string, request: UpdateIntegrationPropertyRequest): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: `update/properties/${id}` }, request);
  }

  deleteIntegrationProperty(id: string): Promise<any> {
    return this.http.post({ controller: 'Integrations', action: `delete/properties/${id}` }, {});
  }
}

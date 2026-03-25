import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateIntegrationRequest, UpdateIntegrationRequest } from '../models/integration/integration.models';
import { CreateIntegrationUserRequest, UpdateIntegrationUserRequest } from '../models/integration/integration-user.models';
import { CreateIntegrationPropertyRequest, UpdateIntegrationPropertyRequest } from '../models/integration/integration-property.models';
import { ConnectTicimaxRequest, ConnectTicimaxResponse } from '../models/integration/integration-ticimax.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class IntegrationsService {
  constructor(private http: HttpClientService) {}

  // ── Integrations ──
  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations' });
  }

  getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'Integrations', action: `paged${buildPaginationQuery(req)}` });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Integrations', action: `${id}` });
  }

  create(request: CreateIntegrationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations' }, request);
  }

  update(id: string, request: UpdateIntegrationRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: `delete/${id}` }, {});
  }

  // ── Integration Users ──
  // getIntegrationUsers(): Promise<any> {
  //   return this.http.get({ controller: 'Integrations', action: 'users' });
  // }

  getIntegrationUsersPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'Integrations', action: `users/paged${buildPaginationQuery(req)}` });
  }

  getIntegrationUserById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Integrations', action: `users/${id}` });
  }

  getUsersByIntegration(integrationId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: `${integrationId}/users` });
  }

  getIntegrationsByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: `users/by-user/${userId}` });
  }

  /** CompanyId'ye göre integration user'ları özet bilgilerle getirir */
  getIntegrationUsersByCompany(companyId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: `users/by-company/${companyId}` });
  }

  createIntegrationUser(request: CreateIntegrationUserRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: 'users' }, request);
  }

  updateIntegrationUser(id: string, request: UpdateIntegrationUserRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: `update/users/${id}` }, request);
  }

  deleteIntegrationUser(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: `delete/users/${id}` }, {});
  }

  // ── Integration Properties ──
  getIntegrationProperties(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: 'properties' });
  }

  getIntegrationPropertyById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Integrations', action: `properties/${id}` });
  }

  getPropertiesByIntegration(integrationId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: `${integrationId}/properties` });
  }

  getPropertiesByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: `properties/by-user/${userId}` });
  }

  createIntegrationProperty(request: CreateIntegrationPropertyRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: 'properties' }, request);
  }

  updateIntegrationProperty(id: string, request: UpdateIntegrationPropertyRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: `update/properties/${id}` }, request);
  }

  deleteIntegrationProperty(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Integrations', action: `delete/properties/${id}` }, {});
  }

  async connectTicimax(request: ConnectTicimaxRequest): Promise<ApiResponse<ConnectTicimaxResponse>> {
    try {
      return await this.http.post<ConnectTicimaxResponse>({ controller: 'Integrations', action: 'connect-ticimax' }, request);
    } catch (error) {
      if (!this.shouldRetryWithFallback(error)) {
        throw error;
      }
    }

    try {
      return await this.http.post<ConnectTicimaxResponse>({ controller: 'Integration', action: 'connect-ticimax' }, request);
    } catch (error) {
      if (!this.shouldRetryWithFallback(error)) {
        throw error;
      }
    }

    return this.http.post<ConnectTicimaxResponse>({ controller: 'Ticimax', action: 'connect-ticimax' }, request);
  }

  private shouldRetryWithFallback(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const maybeError = error as { status?: number };
    return maybeError.status === 404 || maybeError.status === 405;
  }
}

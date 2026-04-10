import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateIntegrationRequest, UpdateIntegrationRequest } from '../models/integration/integration.models';
import { CreateIntegrationUserRequest, UpdateIntegrationUserRequest, DeleteIntegrationUserWithRelationsRequest } from '../models/integration/integration-user.models';
import { CreateIntegrationPropertyRequest, UpdateIntegrationPropertyRequest } from '../models/integration/integration-property.models';
import { ConnectTicimaxRequest, ConnectTicimaxResponse, UpdateTicimaxRequest, TicimaxShipmentDto } from '../models/integration/integration-ticimax.models';
import { CompanyIntegrationsResponse } from '../models/integration/company-integrations.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

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
    return this.http.post<PagedResult<any>>(
      { controller: 'Integrations', action: 'paged' },
      buildPaginationRequest(req),
    );
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
    return this.http.post<PagedResult<any>>(
      { controller: 'Integrations', action: 'users/paged' },
      buildPaginationRequest(req),
    );
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

  /** Company için bağlı entegrasyon verilerini toplu getirir */
  getCompanyIntegrations(companyId: string): Promise<ApiResponse<CompanyIntegrationsResponse>> {
    return this.http.get<CompanyIntegrationsResponse>({ controller: 'Integrations', action: `company/${companyId}/all` });
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

  deleteUserWithRelations(request: DeleteIntegrationUserWithRelationsRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>(
      { controller: 'Integrations', action: 'users/delete-with-relations' },
      request
    );
  }

  // ── Integration Properties ──
  getIntegrationProperties(req?: PaginationRequest): Promise<ApiResponse<any[]>> {
    return this.http.post<any[]>(
      { controller: 'Integrations', action: 'properties/paged' },
      buildPaginationRequest(req),
    );
  }

  getIntegrationPropertyById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Integrations', action: `properties/${id}` });
  }

  getPropertiesByIntegration(integrationId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Integrations', action: `${integrationId}/properties` });
  }

  getPropertiesByIntegrationUser(integrationUserId: string): Promise<ApiResponse<any[]>> {
    return this.http.post<any[]>(
      { controller: 'Integrations', action: `properties/by-integration-user/${integrationUserId}` },
      {},
    );
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

  /** Ticimax bağlantı bilgilerini günceller */
  updateTicimax(request: UpdateTicimaxRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'Ticimax', action: 'update-ticimax' }, request);
  }

  /** Ticimax bağlantı testi yapar */
  testTicimaxConnection(integrationUserId: string, companyId: string): Promise<ApiResponse<boolean>> {
    const qs = `integrationUserId=${encodeURIComponent(integrationUserId)}&companyId=${encodeURIComponent(companyId)}`;
    return this.http.get<boolean>({ controller: 'Ticimax', action: 'test-connection', queryString: qs });
  }

  /** Ticimax kargo firmalarını getirir */
  getCargoFirms(integrationUserId: string, companyId: string, days = 15): Promise<ApiResponse<TicimaxShipmentDto[]>> {
    const qs = `integrationUserId=${encodeURIComponent(integrationUserId)}&companyId=${encodeURIComponent(companyId)}&days=${days}`;
    return this.http.get<TicimaxShipmentDto[]>({ controller: 'Ticimax', action: 'cargo-firms/recent', queryString: qs });
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

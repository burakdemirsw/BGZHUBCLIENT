import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CompanySettingCategory,
  CreateCompanySettingCategoryRequest,
  UpdateCompanySettingCategoryRequest,
  CompanySettingDefinition,
  CreateCompanySettingDefinitionRequest,
  UpdateCompanySettingDefinitionRequest,
  CompanySettingsResponse,
  UpdateCompanySettingsRequest,
} from '../models/company-setting/company-setting.models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class CompanySettingsService {
  constructor(private http: HttpClientService) {}

  // ── Kategoriler ──

  getCategories(): Promise<ApiResponse<CompanySettingCategory[]>> {
    return this.http.get<CompanySettingCategory[]>({ controller: 'CompanySettings', action: 'categories' });
  }

  createCategory(request: CreateCompanySettingCategoryRequest): Promise<ApiResponse<CompanySettingCategory>> {
    return this.http.post<CompanySettingCategory>({ controller: 'CompanySettings', action: 'categories' }, request);
  }

  updateCategory(id: string, request: UpdateCompanySettingCategoryRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'CompanySettings', action: `categories/update/${id}` }, request);
  }

  deleteCategory(id: string): Promise<ApiResponse<object>> {
    return this.http.post<object>({ controller: 'CompanySettings', action: `categories/delete/${id}` }, {});
  }

  // ── Tanımlar (anahtar üzerinden) ──

  getDefinitions(categoryCode?: string): Promise<ApiResponse<CompanySettingDefinition[]>> {
    return this.http.get<CompanySettingDefinition[]>({
      controller: 'CompanySettings',
      action: 'definitions',
      queryString: categoryCode ? `categoryCode=${encodeURIComponent(categoryCode)}` : undefined,
    });
  }

  createDefinition(request: CreateCompanySettingDefinitionRequest): Promise<ApiResponse<CompanySettingDefinition>> {
    return this.http.post<CompanySettingDefinition>({ controller: 'CompanySettings', action: 'definitions' }, request);
  }

  updateDefinition(key: string, request: UpdateCompanySettingDefinitionRequest): Promise<ApiResponse<object>> {
    return this.http.post<object>(
      { controller: 'CompanySettings', action: `definitions/update/${encodeURIComponent(key)}` },
      request,
    );
  }

  deleteDefinition(key: string): Promise<ApiResponse<object>> {
    return this.http.post<object>(
      { controller: 'CompanySettings', action: `definitions/delete/${encodeURIComponent(key)}` },
      {},
    );
  }

  // ── Şirket değerleri ──

  getByCompany(companyId: string): Promise<ApiResponse<CompanySettingsResponse>> {
    return this.http.get<CompanySettingsResponse>({ controller: 'CompanySettings', action: `by-company/${companyId}` });
  }

  updateByCompany(companyId: string, request: UpdateCompanySettingsRequest): Promise<ApiResponse<CompanySettingsResponse>> {
    return this.http.post<CompanySettingsResponse>(
      { controller: 'CompanySettings', action: `by-company/${companyId}` },
      request,
    );
  }
}

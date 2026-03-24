import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CompanySetting,
  CreateCompanySettingRequest,
  UpdateCompanySettingRequest,
} from '../models/company-setting/company-setting.models';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class CompanySettingsService {
  constructor(private http: HttpClientService) {}

  getById(id: string): Promise<ApiResponse<CompanySetting>> {
    return this.http.get<CompanySetting>({ controller: 'CompanySettings' }, id);
  }

  getByCompany(companyId: string): Promise<ApiResponse<CompanySetting>> {
    return this.http.get<CompanySetting>({ controller: 'CompanySettings', action: `by-company/${companyId}` });
  }

  create(request: CreateCompanySettingRequest): Promise<ApiResponse<CompanySetting>> {
    return this.http.post<CompanySetting>({ controller: 'CompanySettings' }, request);
  }

  update(id: string, request: UpdateCompanySettingRequest): Promise<ApiResponse<CompanySetting>> {
    return this.http.post<CompanySetting>({ controller: 'CompanySettings', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'CompanySettings', action: `delete/${id}` }, {});
  }
}

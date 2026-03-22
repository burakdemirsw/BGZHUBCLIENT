import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateNetGsmSettingRequest, UpdateNetGsmSettingRequest } from '../models/netgsm/netgsm.models';

@Injectable({
  providedIn: 'root',
})
export class NetGsmSettingsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'NetGsmSettings' });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'NetGsmSettings' }, id);
  }

  getByApplication(applicationId: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'NetGsmSettings', action: 'by-application' }, applicationId);
  }

  create(request: CreateNetGsmSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'NetGsmSettings' }, request);
  }

  update(id: string, request: UpdateNetGsmSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'NetGsmSettings', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'NetGsmSettings', action: `delete/${id}` }, {});
  }
}

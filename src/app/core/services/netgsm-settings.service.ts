import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateNetGsmSettingRequest, UpdateNetGsmSettingRequest } from '../models/netgsm/netgsm.models';

@Injectable({
  providedIn: 'root',
})
export class NetGsmSettingsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'NetGsmSettings' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'NetGsmSettings' }, id);
  }

  getByApplication(applicationId: string): Promise<any> {
    return this.http.get_new({ controller: 'NetGsmSettings', action: 'by-application' }, applicationId);
  }

  create(request: CreateNetGsmSettingRequest): Promise<any> {
    return this.http.post({ controller: 'NetGsmSettings' }, request);
  }

  update(id: string, request: UpdateNetGsmSettingRequest): Promise<any> {
    return this.http.post({ controller: 'NetGsmSettings', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'NetGsmSettings', action: `delete/${id}` }, {});
  }
}

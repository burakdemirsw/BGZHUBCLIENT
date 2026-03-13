import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { NetGsmSetting, CreateNetGsmSettingRequest, UpdateNetGsmSettingRequest } from '../models/netgsm/netgsm.models';

@Injectable({
  providedIn: 'root',
})
export class NetGsmSettingsService {
  constructor(private http: HttpClientService) {}

  getAll(): Observable<any> {
    return this.http.get_new({ controller: 'NetGsmSettings' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'NetGsmSettings' }, id);
  }

  getByApplication(applicationId: string): Observable<any> {
    return this.http.get_new({ controller: 'NetGsmSettings', action: 'by-application' }, applicationId);
  }

  create(request: CreateNetGsmSettingRequest): Observable<any> {
    return this.http.post({ controller: 'NetGsmSettings' }, request);
  }

  update(id: string, request: UpdateNetGsmSettingRequest): Observable<any> {
    return this.http.put({ controller: 'NetGsmSettings', action: id }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.delete({ controller: 'NetGsmSettings' }, id);
  }
}

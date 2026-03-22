import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateMailSettingRequest, UpdateMailSettingRequest, SendMailRequest } from '../models/mail/mail.models';

@Injectable({
  providedIn: 'root',
})
export class MailSettingsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'MailSettings' });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'MailSettings' }, id);
  }

  create(request: CreateMailSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'MailSettings' }, request);
  }

  update(id: string, request: UpdateMailSettingRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'MailSettings', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'MailSettings', action: `delete/${id}` }, {});
  }

  sendMail(request: SendMailRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'MailSettings', action: 'send' }, request);
  }
}

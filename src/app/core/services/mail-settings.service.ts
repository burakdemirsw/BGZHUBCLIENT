import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateMailSettingRequest, UpdateMailSettingRequest, SendMailRequest } from '../models/mail/mail.models';

@Injectable({
  providedIn: 'root',
})
export class MailSettingsService {
  constructor(private http: HttpClientService) {}

  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'MailSettings' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'MailSettings' }, id);
  }

  create(request: CreateMailSettingRequest): Promise<any> {
    return this.http.post({ controller: 'MailSettings' }, request);
  }

  update(id: string, request: UpdateMailSettingRequest): Promise<any> {
    return this.http.post({ controller: 'MailSettings', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'MailSettings', action: `delete/${id}` }, {});
  }

  sendMail(request: SendMailRequest): Promise<any> {
    return this.http.post({ controller: 'MailSettings', action: 'send' }, request);
  }
}

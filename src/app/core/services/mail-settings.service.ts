import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { MailSetting, CreateMailSettingRequest, UpdateMailSettingRequest, SendMailRequest } from '../models/mail/mail.models';

@Injectable({
  providedIn: 'root',
})
export class MailSettingsService {
  constructor(private http: HttpClientService) {}

  getAll(): Observable<any> {
    return this.http.get_new({ controller: 'MailSettings' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'MailSettings' }, id);
  }

  create(request: CreateMailSettingRequest): Observable<any> {
    return this.http.post({ controller: 'MailSettings' }, request);
  }

  update(id: string, request: UpdateMailSettingRequest): Observable<any> {
    return this.http.put({ controller: 'MailSettings', action: id }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.delete({ controller: 'MailSettings' }, id);
  }

  sendMail(request: SendMailRequest): Observable<any> {
    return this.http.post({ controller: 'MailSettings', action: 'send' }, request);
  }
}

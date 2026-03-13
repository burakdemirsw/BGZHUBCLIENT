import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { CreateApplicationRequest, UpdateApplicationRequest } from '../models/application/application.models';

@Injectable({
  providedIn: 'root',
})
export class ApplicationsService {
  constructor(private http: HttpClientService) {}

  getAll(): Observable<any> {
    return this.http.get_new({ controller: 'Apps', action: 'applications' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Apps', action: `applications/${id}` });
  }

  create(request: CreateApplicationRequest): Observable<any> {
    return this.http.post({ controller: 'Apps', action: 'applications' }, request);
  }

  update(id: string, request: UpdateApplicationRequest): Observable<any> {
    return this.http.post({ controller: 'Apps', action: `update/applications/${id}` }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.post({ controller: 'Apps', action: `delete/applications/${id}` }, {});
  }
}

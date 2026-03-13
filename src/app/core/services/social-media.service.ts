import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import {
  CreateSocialMediaAccountRequest,
  UpdateSocialMediaAccountRequest,
  CreateSocialMediaAccountDescriptionRequest,
  UpdateSocialMediaAccountDescriptionRequest,
  CreateSocialMediaAccountPropertyRequest,
  UpdateSocialMediaAccountPropertyRequest,
} from '../models/social-media/social-media.models';

@Injectable({
  providedIn: 'root',
})
export class SocialMediaService {
  constructor(private http: HttpClientService) {}

  // === Accounts ===
  getAccounts(): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'accounts' });
  }

  getAccountById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/${id}` });
  }

  getAccountsByUser(userId: string): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/by-user/${userId}` });
  }

  createAccount(request: CreateSocialMediaAccountRequest): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'accounts' }, request);
  }

  updateAccount(id: string, request: UpdateSocialMediaAccountRequest): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/accounts/${id}` }, request);
  }

  deleteAccount(id: string): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/accounts/${id}` }, {});
  }

  // === Descriptions ===
  getDescriptions(): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'descriptions' });
  }

  getDescriptionById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `descriptions/${id}` });
  }

  getDescriptionsByAccount(accountId: string): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/${accountId}/descriptions` });
  }

  createDescription(request: CreateSocialMediaAccountDescriptionRequest): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'descriptions' }, request);
  }

  updateDescription(id: string, request: UpdateSocialMediaAccountDescriptionRequest): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/descriptions/${id}` }, request);
  }

  deleteDescription(id: string): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/descriptions/${id}` }, {});
  }

  // === Properties ===
  getProperties(): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'properties' });
  }

  getPropertyById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `properties/${id}` });
  }

  getPropertiesByAccount(accountId: string): Observable<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/${accountId}/properties` });
  }

  createProperty(request: CreateSocialMediaAccountPropertyRequest): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'properties' }, request);
  }

  updateProperty(id: string, request: UpdateSocialMediaAccountPropertyRequest): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/properties/${id}` }, request);
  }

  deleteProperty(id: string): Observable<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/properties/${id}` }, {});
  }
}

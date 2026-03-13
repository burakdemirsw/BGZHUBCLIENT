import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CreateSocialMediaAccountRequest,
  UpdateSocialMediaAccountRequest,
  CreateSocialMediaAccountDescriptionRequest,
  UpdateSocialMediaAccountDescriptionRequest,
  CreateSocialMediaAccountPropertyRequest,
  UpdateSocialMediaAccountPropertyRequest,
  CreateUserSocialMediaAccountRequest,
  UpdateUserSocialMediaAccountRequest,
} from '../models/social-media/social-media.models';

@Injectable({
  providedIn: 'root',
})
export class SocialMediaService {
  constructor(private http: HttpClientService) {}

  // === Accounts ===
  getAccounts(): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'accounts' });
  }

  getAccountById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/${id}` });
  }

  getAccountsByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/by-user/${userId}` });
  }

  createAccount(request: CreateSocialMediaAccountRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'accounts' }, request);
  }

  updateAccount(id: string, request: UpdateSocialMediaAccountRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/accounts/${id}` }, request);
  }

  deleteAccount(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/accounts/${id}` }, {});
  }

  // === Descriptions ===
  getDescriptions(): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'descriptions' });
  }

  getDescriptionById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `descriptions/${id}` });
  }

  getDescriptionsByAccount(accountId: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/${accountId}/descriptions` });
  }

  createDescription(request: CreateSocialMediaAccountDescriptionRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'descriptions' }, request);
  }

  updateDescription(id: string, request: UpdateSocialMediaAccountDescriptionRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/descriptions/${id}` }, request);
  }

  deleteDescription(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/descriptions/${id}` }, {});
  }

  // === Properties ===
  getProperties(): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'properties' });
  }

  getPropertyById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `properties/${id}` });
  }

  getPropertiesByAccount(accountId: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `accounts/${accountId}/properties` });
  }

  createProperty(request: CreateSocialMediaAccountPropertyRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'properties' }, request);
  }

  updateProperty(id: string, request: UpdateSocialMediaAccountPropertyRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/properties/${id}` }, request);
  }

  deleteProperty(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/properties/${id}` }, {});
  }

  // === User Accounts ===
  getUserAccounts(): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: 'user-accounts' });
  }

  getUserAccountById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `user-accounts/${id}` });
  }

  getUserAccountsByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `user-accounts/by-user/${userId}` });
  }

  getUserAccountsByAccount(accountId: string): Promise<any> {
    return this.http.get_new({ controller: 'SocialMedia', action: `user-accounts/by-account/${accountId}` });
  }

  createUserAccount(request: CreateUserSocialMediaAccountRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: 'user-accounts' }, request);
  }

  updateUserAccount(id: string, request: UpdateUserSocialMediaAccountRequest): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `update/user-accounts/${id}` }, request);
  }

  deleteUserAccount(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `delete/user-accounts/${id}` }, {});
  }
}

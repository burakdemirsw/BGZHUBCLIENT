import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
  CreateSocialMediaAccountRequest,
  UpdateSocialMediaAccountRequest,
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
  getAccountsPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
    let action = `accounts?PageNumber=${pageNumber}&PageSize=${pageSize}`;
    if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
    return this.http.get_new({ controller: 'SocialMedia', action });
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
    return this.http.post({ controller: 'SocialMedia', action: `accounts/update/${id}` }, request);
  }

  deleteAccount(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `accounts/delete/${id}` }, {});
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
    return this.http.post({ controller: 'SocialMedia', action: `properties/update/${id}` }, request);
  }

  deleteProperty(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `properties/delete/${id}` }, {});
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
    return this.http.post({ controller: 'SocialMedia', action: `user-accounts/update/${id}` }, request);
  }

  deleteUserAccount(id: string): Promise<any> {
    return this.http.post({ controller: 'SocialMedia', action: `user-accounts/delete/${id}` }, {});
  }

}

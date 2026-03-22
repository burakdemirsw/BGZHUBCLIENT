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
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
  providedIn: 'root',
})
export class SocialMediaService {
  constructor(private http: HttpClientService) {}

  // === Accounts ===
  getAccountsPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'SocialMedia', action: `accounts${buildPaginationQuery(req)}` });
  }

  getAccountById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'SocialMedia', action: `accounts/${id}` });
  }

  getAccountsByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'SocialMedia', action: `accounts/by-user/${userId}` });
  }

  createAccount(request: CreateSocialMediaAccountRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: 'accounts' }, request);
  }   

  updateAccount(id: string, request: UpdateSocialMediaAccountRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: `accounts/update/${id}` }, request);
  }

  deleteAccount(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: `accounts/delete/${id}` }, {});
  }
    
  // === Properties ===
  getProperties(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'SocialMedia', action: 'properties' });
  }
  
  getPropertyById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'SocialMedia', action: `properties/${id}` });
  }

  getPropertiesByAccount(accountId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'SocialMedia', action: `accounts/${accountId}/properties` });
  }

  createProperty(request: CreateSocialMediaAccountPropertyRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: 'properties' }, request);
  }

  updateProperty(id: string, request: UpdateSocialMediaAccountPropertyRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: `properties/update/${id}` }, request);
  }

  deleteProperty(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: `properties/delete/${id}` }, {});
  }

  // === User Accounts ===
  getUserAccounts(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
    return this.http.get<PagedResult<any>>({ controller: 'SocialMedia', action: `user-accounts${buildPaginationQuery(req)}` });
  }

  getUserAccountById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'SocialMedia', action: `user-accounts/${id}` });
  }

  getUserAccountsByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'SocialMedia', action: `user-accounts/by-user/${userId}` });
  }

  getUserAccountsByAccount(accountId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'SocialMedia', action: `user-accounts/by-account/${accountId}` });
  }

  createUserAccount(request: CreateUserSocialMediaAccountRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: 'user-accounts' }, request);
  }

  updateUserAccount(id: string, request: UpdateUserSocialMediaAccountRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: `user-accounts/update/${id}` }, request);
  }

  deleteUserAccount(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'SocialMedia', action: `user-accounts/delete/${id}` }, {});
  }

}

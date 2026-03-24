import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { AuthStateService } from './auth-state.service';
import { LoginRequest, RegisterRequest, RegisterWithCompanyRequest, RefreshTokenRequest } from '../models/auth/auth.models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private httpClientService: HttpClientService,
    private router: Router,
    private injector: Injector,
    private authState: AuthStateService
  ) {}

  logout(): void {
    localStorage.clear();
    sessionStorage.clear();
    this.authState.clearProfile();
    // Lazy import ile circular dependency'den kaçın
    try {
      const mod = require('./user-menu.service');
      const userMenuService = this.injector.get<any>(mod.UserMenuService);
      userMenuService.clearMenus();
    } catch { /* ignore */ }
    this.router.navigate(['/home']);
  }

  login(loginRequest: LoginRequest): Promise<ApiResponse<any>> {
    return this.httpClientService.post<any>(
      { controller: 'Auth', action: 'login' },
      loginRequest
    );
  }

  register(registerRequest: RegisterRequest): Promise<ApiResponse<any>> {
    return this.httpClientService.post<any>(
      { controller: 'Auth', action: 'register' },
      registerRequest
    );
  }

  registerWithCompany(registerRequest: RegisterWithCompanyRequest): Promise<ApiResponse<any>> {
    return this.httpClientService.post<any>(
      { controller: 'Auth', action: 'register-with-company' },
      registerRequest
    );
  }

  refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<ApiResponse<any>> {
    return this.httpClientService.post<any>(
      { controller: 'Auth', action: 'refresh-token' },
      refreshTokenRequest
    );
  }
}

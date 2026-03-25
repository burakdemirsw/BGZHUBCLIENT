import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { AuthStateService } from './auth-state.service';
import { UserMenuService } from './user-menu.service';
import { LoginRequest, RegisterRequest, RegisterWithCompanyRequest, RefreshTokenRequest, AuthResponse } from '../models/auth/auth.models';

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
    try {
      const userMenuService = this.injector.get(UserMenuService);
      userMenuService.clearMenus();
    } catch { /* ignore */ }
    this.router.navigate(['/auth/sign-in']).then(success => {
      if (!success) {
        window.location.href = '/auth/sign-in';
      }
    }).catch(() => {
      window.location.href = '/auth/sign-in';
    });
  }

  login(loginRequest: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.httpClientService.post<AuthResponse>(
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

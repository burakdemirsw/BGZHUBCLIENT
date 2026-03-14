import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClientService } from './http-client.service';
import { AuthStateService } from './auth-state.service';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '../models/auth/auth.models';

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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.authState.clearProfile();
    // Lazy import ile circular dependency'den kaçın
    try {
      const mod = require('./user-menu.service');
      const userMenuService = this.injector.get<any>(mod.UserMenuService);
      userMenuService.clearMenus();
    } catch { /* ignore */ }
    this.router.navigate(['/auth/sign-in']);
  }

  login(loginRequest: LoginRequest): Promise<any> {
    return this.httpClientService.post(
      { controller: 'Auth', action: 'login' },
      loginRequest
    );
  }

  register(registerRequest: RegisterRequest): Promise<any> {
    return this.httpClientService.post(
      { controller: 'Auth', action: 'register' },
      registerRequest
    );
  }

  refreshToken(refreshTokenRequest: RefreshTokenRequest): Promise<any> {
    return this.httpClientService.post(
      { controller: 'Auth', action: 'refresh-token' },
      refreshTokenRequest
    );
  }
}

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { LoginRequest, RegisterRequest, RefreshTokenRequest } from '../models/auth/auth.models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private httpClientService: HttpClientService) {}

  login(loginRequest: LoginRequest): Observable<any> {
    return this.httpClientService.post(
      { controller: 'Auth', action: 'login' },
      loginRequest
    );
  }

  register(registerRequest: RegisterRequest): Observable<any> {
    return this.httpClientService.post(
      { controller: 'Auth', action: 'register' },
      registerRequest
    );
  }

  refreshToken(refreshTokenRequest: RefreshTokenRequest): Observable<any> {
    return this.httpClientService.post(
      { controller: 'Auth', action: 'refresh-token' },
      refreshTokenRequest
    );
  }
}

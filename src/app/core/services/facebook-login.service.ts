import { Injectable } from '@angular/core';
import { FacebookService, InitParams, LoginOptions, LoginResponse } from 'ngx-facebook';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';

export interface FacebookConfig {
  appId: string;
  configId: string;
  version: string;
}

@Injectable({
  providedIn: 'root',
})
export class FacebookLoginService {
  private sdkReady: Promise<void> | null = null;

  constructor(
    private http: HttpClientService,
    private fb: FacebookService
  ) {}

  async initFacebookSdk(config: FacebookConfig): Promise<void> {
    if (this.sdkReady) {
      return this.sdkReady;
    }

    this.sdkReady = this.fb.init({
      appId: config.appId,
      cookie: true,
      xfbml: true,
      version: config.version,
    } as InitParams);

    return this.sdkReady;
  }

  async fbLogin(configId: string): Promise<string> {
    if (this.sdkReady) {
      await this.sdkReady;
    }

    const options: any = {
      config_id: configId,
      response_type: 'code',
      override_default_response_type: true,
    };

    const response: any = await this.fb.login(options);

    if (response.status === 'connected' && response.authResponse?.code) {
      return response.authResponse.code;
    } else {
      throw new Error('Facebook login cancelled or not authorized.');
    }
  }

  sendFacebookCode(code: string): Promise<ApiResponse<any>> {
    return this.http.post<any>(
      { controller: 'Auth', action: 'meta-login' },
      { code }
    );
  }

  sendWhatsappCode(code: string): Promise<ApiResponse<any>> {
    return this.http.post<any>(
      { controller: 'Auth', action: 'whatsapp-login' },
      { code }
    );
  }
}

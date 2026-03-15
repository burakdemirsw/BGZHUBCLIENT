import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';

declare const FB: any;

export interface FacebookConfig {
  appId: string;
  configId: string;
  version: string;
}

@Injectable({
  providedIn: 'root',
})
export class FacebookLoginService {
  private sdkLoaded = false;

  constructor(private http: HttpClientService) {}

  initFacebookSdk(config: FacebookConfig): Promise<void> {
    return new Promise((resolve) => {
      if (this.sdkLoaded) {
        resolve();
        return;
      }

      window.fbAsyncInit = () => {
        FB.init({
          appId: config.appId,
          cookie: true,
          xfbml: true,
          version: config.version,
        });
        this.sdkLoaded = true;
        resolve();
      };

      if (document.getElementById('facebook-jssdk')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });
  }

  fbLogin(configId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      FB.login(
        (response: any) => {
          if (response.status === 'connected') {
            const code = response.authResponse.code;
            this.sendCodeToBackend(code).then(resolve).catch(reject);
          } else {
            reject(new Error('Facebook login cancelled or not authorized.'));
          }
        },
        {
          config_id: configId,
          response_type: 'code',
          override_default_response_type: true,
        }
      );
    });
  }

  private sendCodeToBackend(code: string): Promise<any> {
    return this.http.post(
      { controller: 'Auth', action: 'meta-login' },
      { code }
    );
  }
}

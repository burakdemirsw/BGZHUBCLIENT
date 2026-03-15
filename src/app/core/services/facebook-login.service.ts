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
  private sdkReady: Promise<void> | null = null;

  constructor(private http: HttpClientService) {}

  initFacebookSdk(config: FacebookConfig): Promise<void> {
    if (this.sdkReady) {
      return this.sdkReady;
    }

    this.sdkReady = new Promise<void>((resolve) => {
      // SDK zaten yüklü ve init edilmişse
      if (typeof FB !== 'undefined' && FB.init) {
        FB.init({
          appId: config.appId,
          cookie: true,
          xfbml: true,
          version: config.version,
        });
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
        resolve();
      };

      // Script zaten eklenmişse tekrar ekleme, ama yine callback'i bekle
      if (document.getElementById('facebook-jssdk')) {
        return;
      }

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    });

    return this.sdkReady;
  }

  async fbLogin(configId: string): Promise<any> {
    // SDK hazır olana kadar bekle
    if (this.sdkReady) {
      await this.sdkReady;
    }

    return new Promise((resolve, reject) => {
      FB.login(
        (response: any) => {
          console.log('FB.login full response:', response);

          if (response.status === 'connected' && response.authResponse) {
            const code = response.authResponse.code;
            console.log('FB.login code:', code);
            console.log('FB.login authResponse:', response.authResponse);
            resolve(code);
          } else {
            console.warn('FB.login failed or cancelled:', response);
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

  sendFacebookCode(code: string): Promise<any> {
    return this.http.post(
      { controller: 'Auth', action: 'meta-login' },
      { code }
    );
  }

  sendWhatsappCode(code: string): Promise<any> {
    return this.http.post(
      { controller: 'Auth', action: 'whatsapp-login' },
      { code }
    );
  }
}

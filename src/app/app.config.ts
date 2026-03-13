import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { DecimalPipe } from '@angular/common'
import {provideDaterangepickerLocale} from 'ngx-daterangepicker-bootstrap';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
      DecimalPipe,
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes),
      provideAnimations(),
      provideHttpClient(withInterceptors([authInterceptor])),
      provideDaterangepickerLocale({
          separator: ' - ',
          cancelLabel: 'Cancel',
      }),
      { provide: JWT_OPTIONS, useValue: { tokenGetter: () => localStorage.getItem('accessToken') } },
      JwtHelperService,
  ],
};

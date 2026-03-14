import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        // Client-side hata
        errorMessage = `Hata: ${error.error.message}`;
      } else {
        // Server-side hata
        switch (error.status) {
          case 400:
            errorMessage = 'Geçersiz istek. Lütfen gönderilen verileri kontrol edin.';
            break;
          case 401:
            errorMessage = 'Oturum süresi doldu. Lütfen tekrar giriş yapın.';
            localStorage.removeItem('accessToken');
            router.navigate(['/auth/login']);
            break;
          case 403:
            errorMessage = 'Bu işlem için yetkiniz bulunmamaktadır.';
            break;
          case 404:
            errorMessage = 'İstenen kaynak bulunamadı.';
            break;
          case 409:
            errorMessage = 'Çakışma hatası. Kayıt zaten mevcut olabilir.';
            break;
          case 422:
            errorMessage = 'İşlenemeyen veri. Lütfen girdiğiniz bilgileri kontrol edin.';
            break;
          case 429:
            errorMessage = 'Çok fazla istek gönderildi. Lütfen biraz bekleyin.';
            break;
          case 500:
            errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
            break;
          case 502:
            errorMessage = 'Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin.';
            break;
          case 503:
            errorMessage = 'Servis şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
            break;
          case 0:
            errorMessage = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
            break;
          default:
            errorMessage = `Beklenmeyen bir hata oluştu. (Kod: ${error.status})`;
            break;
        }
      }

      console.error('HTTP Hatası:', {
        status: error.status,
        message: errorMessage,
        url: error.url,
        error: error.error,
      });

      return throwError(() => ({ status: error.status, message: errorMessage, error: error.error }));
    })
  );
};

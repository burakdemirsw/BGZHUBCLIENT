import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MenusService } from '@/app/core/services/menus.service';
import { UserMenuService } from '@/app/core/services/user-menu.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private router: Router,
    private jwtHelper: JwtHelperService,
    private menusService: MenusService,
    private userMenuService: UserMenuService
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const token: string | null = localStorage.getItem('accessToken');

    if (!token) {
      this.router.navigate(['/auth/sign-in'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    try {
      const isExpired = this.jwtHelper.isTokenExpired(token);
      if (isExpired) {
        localStorage.clear();
        this.router.navigate(['/auth/sign-in'], { queryParams: { returnUrl: state.url } });
        return false;
      }
    } catch (e) {
      // Token JWT formatında değilse (ör: dev-token), sadece varlığını kontrol et
      return true;
    }

    // Menü yetki kontrolü
    try {
      const userId = this.userMenuService.getUserIdFromToken();
      if (!userId) {
        return true; // userId çözülemediyse geçiş izni ver
      }

      // URL'den query parametrelerini kaldır
      const cleanUrl = '/' + state.url.split('?')[0].replace(/^\/+/, '');

      const response = await this.menusService.isUserAuthorized(userId, cleanUrl);
      const isAuthorized = response?.data ?? response?.result ?? response === true;

      if (!isAuthorized) {
        this.router.navigate(['/error/403']);
        return false;
      }
    } catch (err) {
      console.error('AuthGuard: Yetki kontrolü hatası', err);
      // API hatası durumunda geçiş izni ver (fail-open)
      return true;
    }

    return true;
  }
}

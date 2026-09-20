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

    // Menüsü veritabanında tutulmayan bölümler (ör. WMS) menü bazlı yetki
    // kontrolünden muaftır; token kontrolü yine de yukarıda uygulanır.
    if (next.data?.['skipMenuAuth'] === true) {
      return true;
    }

    // Menü yetki kontrolü
    try {
      const userId = this.userMenuService.getUserIdFromToken();
      if (!userId) {
        return true; // userId çözülemediyse geçiş izni ver
      }

      // URL'den query parametrelerini kaldır
      let cleanUrl = '/' + state.url.split('?')[0].replace(/^\/+/, '');

      // Route parametrelerini kaldır (route config'deki :param değerlerini URL'den çıkar)
      const routeConfig = next.routeConfig;
      if (routeConfig?.path) {
        const segments = routeConfig.path.split('/');
        const urlSegments = cleanUrl.replace(/^\/+/, '').split('/');
        const baseSegments: string[] = [];
        for (let i = 0; i < segments.length; i++) {
          if (!segments[i].startsWith(':')) {
            baseSegments.push(urlSegments[i]);
          }
        }
        cleanUrl = '/' + baseSegments.join('/');
      }

      const response = await this.menusService.isUserAuthorized(userId, cleanUrl);
      const isAuthorized = response?.data === true;

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

import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(
    private router: Router,
    private jwtHelper: JwtHelperService
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

    const isExpired = this.jwtHelper.isTokenExpired(token);

    if (isExpired) {
      localStorage.clear();
      this.router.navigate(['/auth/sign-in'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    return true;
  }
}

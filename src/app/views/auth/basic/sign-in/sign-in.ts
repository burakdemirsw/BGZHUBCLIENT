import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '@/app/core/services/user.service';
import { UserMenuService } from '@/app/core/services/user-menu.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { LoginRequest, AuthResponse } from '@/app/core/models/auth/auth.models';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sign-in',
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './sign-in.html',
    styleUrl: './sign-in.scss'
})
export class SignIn {
    currentYear = currentYear;
    credits = credits;

    email = '';
    password = '';
    rememberMe = false;
    loading = false;
    errorMessage = '';
    showPassword = false;

    constructor(private userService: UserService, private userMenuService: UserMenuService, private authState: AuthStateService, private router: Router, private route: ActivatedRoute) {}

    onSubmit() {
        this.loading = true;
        this.errorMessage = '';

        const loginRequest: LoginRequest = {
            email: this.email,
            password: this.password
        };

        this.doLogin(loginRequest);
    }

    async doLogin(loginRequest: LoginRequest) {
        try {
            const response: any = await this.userService.login(loginRequest);
            this.loading = false;
            console.log('Login response:', response);

            // Token'ları kaydet - farklı response yapılarını destekle
            const accessToken = response?.accessToken ?? response?.token?.accessToken ?? response?.data?.accessToken ?? response?.token;
            const refreshToken = response?.refreshToken ?? response?.token?.refreshToken ?? response?.data?.refreshToken;

            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
            }
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            // Kullanıcı profil bilgilerini kaydet
            const name = response?.name ?? response?.data?.name ?? '';
            const surname = response?.surname ?? response?.data?.surname ?? '';
            const lastLoginDate = response?.lastLoginDate ?? response?.data?.lastLoginDate ?? '';
            this.authState.setProfile({ name, surname, lastLoginDate });

            // Kullanıcı menülerini yükle
            await this.userMenuService.loadUserMenus();

            // returnUrl varsa oraya, yoksa dashboard'a yönlendir
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            this.router.navigateByUrl(returnUrl);
        } catch (err: any) {
            this.loading = false;
            this.errorMessage = err?.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
        }
    }

    devLogin() {
        localStorage.setItem('accessToken', 'dev-token');
        localStorage.setItem('refreshToken', 'dev-refresh-token');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
    }
}

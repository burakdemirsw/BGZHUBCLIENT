import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '@/app/core/services/user.service';
import { LoginRequest } from '@/app/core/models/auth/auth.models';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-sign-in',
    imports: [RouterLink, FormsModule, CommonModule],
    templateUrl: './sign-in.html',
    styles: ``
})
export class SignIn {
    currentYear = currentYear;
    credits = credits;

    email = '';
    password = '';
    rememberMe = false;
    loading = false;
    errorMessage = '';

    constructor(private userService: UserService, private router: Router, private route: ActivatedRoute) {}

    onSubmit() {
        this.loading = true;
        this.errorMessage = '';

        const loginRequest: LoginRequest = {
            email: this.email,
            password: this.password
        };

        this.userService.login(loginRequest).subscribe({
            next: (response: any) => {
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

                // returnUrl varsa oraya, yoksa dashboard'a yönlendir
                const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                this.router.navigateByUrl(returnUrl);
            },
            error: (err: any) => {
                this.loading = false;
                this.errorMessage = err?.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
            }
        });
    }
}

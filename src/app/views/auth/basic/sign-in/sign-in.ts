import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
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

    constructor(private userService: UserService, private router: Router) {}

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
                // Token'ları kaydet
                if (response?.accessToken) {
                    localStorage.setItem('accessToken', response.accessToken);
                }
                if (response?.refreshToken) {
                    localStorage.setItem('refreshToken', response.refreshToken);
                }
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                this.loading = false;
                this.errorMessage = err?.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
            }
        });
    }
}

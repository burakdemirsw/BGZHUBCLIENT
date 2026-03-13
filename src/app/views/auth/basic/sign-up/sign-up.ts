import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { PasswordStrengthBar } from "@app/components/password-strength-bar";
import { CommonModule } from '@angular/common';
import { UserService } from '@/app/core/services/user.service';
import { RegisterRequest } from '@/app/core/models/auth/auth.models';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-sign-up',
    imports: [RouterLink, PasswordStrengthBar, FormsModule, CommonModule, LogoComponent],
    templateUrl: './sign-up.html',
    styles: ``
})
export class SignUp {
    currentYear = currentYear;
    credits = credits;

    name = '';
    lastName = '';
    email = '';
    password = '';
    agreeTerms = false;
    loading = false;
    errorMessage = '';
    successMessage = '';

    constructor(private userService: UserService, private router: Router) {}

    onSubmit() {
        this.loading = true;
        this.errorMessage = '';
        this.successMessage = '';

        const registerRequest: RegisterRequest = {
            name: this.name,
            lastName: this.lastName,
            email: this.email,
            password: this.password
        };

        this.doRegister(registerRequest);
    }

    async doRegister(registerRequest: RegisterRequest) {
        try {
            const response: any = await this.userService.register(registerRequest);
            this.loading = false;
            this.successMessage = 'Hesabınız başarıyla oluşturuldu! Giriş sayfasına yönlendiriliyorsunuz...';
            setTimeout(() => {
                this.router.navigate(['/auth/sign-in']);
            }, 2000);
        } catch (err: any) {
            this.loading = false;
            this.errorMessage = err?.error?.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.';
        }
    }
}

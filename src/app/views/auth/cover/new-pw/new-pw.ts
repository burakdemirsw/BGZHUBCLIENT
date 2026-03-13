
import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PasswordStrengthBar } from "@app/components/password-strength-bar";
import { FormsModule } from '@angular/forms';
import { NgOtpInputComponent } from 'ng-otp-input';
import { LucideAngularModule, LucideKeyRound } from "lucide-angular";
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-new-pw',
    host: { 'data-component-id': 'auth2-new-pw' },
    imports: [RouterLink,  PasswordStrengthBar, FormsModule,NgOtpInputComponent, LucideAngularModule, LogoComponent],
    templateUrl: './new-pw.html',
    styles: ``,
})
export class NewPw {
 currentYear = currentYear
    credits = credits
    password: string = '';
    protected readonly LucideKeyRound = LucideKeyRound;
}

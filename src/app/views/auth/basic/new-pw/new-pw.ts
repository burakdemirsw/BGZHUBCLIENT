import {credits, currentYear} from '@/app/constants';
import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';
import {NgOtpInputComponent} from 'ng-otp-input';
import {PasswordStrengthBar} from "@app/components/password-strength-bar";
import {LogoComponent} from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-new-pw',
    imports: [RouterLink, NgOtpInputComponent, FormsModule, PasswordStrengthBar, LogoComponent],
    templateUrl: './new-pw.html',
    styles: ``
})
export class NewPw {
    currentYear = currentYear
    credits = credits
    password: string = '';
}

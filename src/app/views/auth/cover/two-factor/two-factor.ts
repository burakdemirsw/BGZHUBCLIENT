
import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOtpInputComponent } from 'ng-otp-input';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
  selector: 'app-two-factor',
  host: { 'data-component-id': 'auth2-factor' },
  imports: [RouterLink,NgOtpInputComponent, LogoComponent],
  templateUrl: './two-factor.html',
  styles: ``
})
export class TwoFactor {
   currentYear = currentYear
    credits = credits
}

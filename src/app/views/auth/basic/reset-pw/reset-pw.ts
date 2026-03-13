import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-reset-pw',
    imports: [RouterLink, LogoComponent],
    templateUrl: './reset-pw.html',
    styles: ``
})
export class ResetPw {
    currentYear = currentYear
    credits = credits
}

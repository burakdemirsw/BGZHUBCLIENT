
import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-success-mail',
    host: { 'data-component-id': 'auth2-success-mail' },
    imports: [RouterLink, LogoComponent],
    templateUrl: './success-mail.html',
    styles: ``
})
export class SuccessMail {
    currentYear = currentYear
    credits = credits
}

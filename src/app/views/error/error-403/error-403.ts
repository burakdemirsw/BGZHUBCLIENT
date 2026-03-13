
import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-error-403',
    imports: [RouterLink, LogoComponent],
    templateUrl: './error-403.html',
    styles: ``
})
export class Error403 {
    currentYear = currentYear
    credits = credits
}

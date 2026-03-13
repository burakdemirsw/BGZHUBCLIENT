
import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-error-404',
    imports: [RouterLink, LogoComponent],
    templateUrl: './error-404.html',
    styles: ``
})
export class Error404 {
    currentYear = currentYear
    credits = credits
}

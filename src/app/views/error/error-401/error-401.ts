
import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-error-401',
    imports: [RouterLink, LogoComponent],
    templateUrl: './error-401.html',
    styles: ``
})
export class Error401 {
    currentYear = currentYear
    credits = credits
}

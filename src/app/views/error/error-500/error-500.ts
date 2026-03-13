import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-error-500',
    imports: [LogoComponent],
    templateUrl: './error-500.html',
    styles: ``
})
export class Error500 {
    currentYear = currentYear
    credits = credits
}

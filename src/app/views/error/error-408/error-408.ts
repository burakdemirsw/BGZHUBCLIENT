import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-error-408',
    imports: [LogoComponent],
    templateUrl: './error-408.html',
    styles: ``
})
export class Error408 {
    currentYear = currentYear
    credits = credits
    
}

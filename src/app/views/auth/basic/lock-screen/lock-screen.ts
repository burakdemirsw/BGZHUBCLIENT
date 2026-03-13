import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-lock-screen',
    imports: [RouterLink, LogoComponent],
    templateUrl: './lock-screen.html',
    styles: ``
})
export class LockScreen {
    currentYear = currentYear
    credits = credits
}

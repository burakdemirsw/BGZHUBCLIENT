import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, LucideCircleUser } from "lucide-angular";
import { LogoComponent } from '@/app/components/logo/logo.component';
@Component({
    selector: 'app-reset-pw',
    host: { 'data-component-id': 'auth2-reset-pw' },
    imports: [RouterLink, LucideAngularModule, LogoComponent],
    templateUrl: './reset-pw.html',
    styles: ``,
})
export class ResetPw {
    currentYear = currentYear
    credits = credits

    protected readonly LucideCircleUser = LucideCircleUser;
}

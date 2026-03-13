import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
    selector: 'app-delete-account',
    host: { 'data-component-id': 'auth2-delete-account' },
    imports: [LogoComponent],
    templateUrl: './delete-account.html',
    styles: ``
})
export class DeleteAccount{
    currentYear = currentYear
    credits = credits
}

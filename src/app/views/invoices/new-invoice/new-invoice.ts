import {Component} from '@angular/core';
import { LOGO_BLACK } from '@/app/constants/logo-paths';
import {PageTitle} from '@app/components/page-title';
import {NgIcon} from '@ng-icons/core';
import {RouterLink} from '@angular/router';
import {FlatpickrDirective} from 'angularx-flatpickr';

@Component({
  selector: 'app-new-invoice',
    imports: [PageTitle, NgIcon, RouterLink,FlatpickrDirective],
  templateUrl: './new-invoice.html',
  styles: ``
})
export class NewInvoice {
    previewSrc: string = LOGO_BLACK;

    onLogoSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.previewSrc = e.target?.result as string;
            };
            reader.readAsDataURL(input.files[0]);
        }
    }
}

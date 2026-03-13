import { credits, currentYear } from '@/app/constants';
import { Component } from '@angular/core';
import { LogoComponent } from '@/app/components/logo/logo.component';

@Component({
  selector: 'app-maintenance',
  imports: [LogoComponent],
  templateUrl: './maintenance.html',
  styles: ``
})
export class Maintenance {
    currentYear = currentYear
    credits = credits
}

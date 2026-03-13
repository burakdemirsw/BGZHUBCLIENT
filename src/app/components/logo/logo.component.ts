import { Component, Input } from '@angular/core';
import { LOGO_WHITE, LOGO_COLOR } from '../../constants/logo-paths';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent {
  logoWhite = LOGO_WHITE;
  logoColor = LOGO_COLOR;
  @Input() logoHeight: number = 28;
}

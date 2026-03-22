import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LayoutStoreService } from '@core/services/layout-store.service';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent {
  @Input() logoHeight: number = 28;

  constructor(public layout: LayoutStoreService) {}

  toggleSidebar() {
    const html = document.documentElement;
    const currentSize = html.getAttribute('data-sidenav-size');
    
    if (currentSize === 'condensed') {
      this.layout.setSidenavSize('default');
    } else {
      this.layout.setSidenavSize('condensed');
    }
  }
}

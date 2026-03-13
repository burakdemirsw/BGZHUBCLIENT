import { Component } from '@angular/core';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {LayoutGrid, LucideAngularModule, LucideLayoutGrid} from 'lucide-angular';
import {NgIcon} from '@ng-icons/core';

@Component({
  selector: 'app-application-menu',
    imports: [NgbDropdownModule, LucideAngularModule, NgIcon],
  templateUrl: './application-menu.html',
  styles: ``
})
export class ApplicationMenu {
    apps = [
        { name: 'Google', icon: 'assets/images/logos/google.svg', type: 'img' },
        { name: 'Figma', icon: 'assets/images/logos/figma.svg', type: 'img' },
        { name: 'Slack', icon: 'assets/images/logos/slack.svg', type: 'img' },
        { name: 'Dropbox', icon: 'assets/images/logos/dropbox.svg', type: 'img' },
        { name: 'Takvim', icon: 'tablerCalendar', type: 'icon' },
        { name: 'Sohbet', icon: 'tablerMessageCircle', type: 'icon' },
        { name: 'Dosyalar', icon: 'tablerFolder', type: 'icon' },
        { name: 'Ekip', icon: 'tablerUsers', type: 'icon' },
    ];
    protected readonly LucideLayoutGrid = LucideLayoutGrid;
    protected readonly LayoutGrid = LayoutGrid;
}

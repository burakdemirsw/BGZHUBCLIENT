import {Component, HostListener, inject} from '@angular/core';
import { LOGO_WHITE, LOGO_COLOR } from '@/app/constants/logo-paths';
import {RouterLink} from '@angular/router';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {ScrollService} from '@core/services/scroll.service';
import {NgbCollapseModule} from '@ng-bootstrap/ng-bootstrap';
import {NgIcon} from '@ng-icons/core';

@Component({
    selector: 'app-header',
    imports: [NgIcon, RouterLink, NgbCollapseModule],
    templateUrl: './header.html',
    styles: ``
})
export class Header {
    isCollapsed = true;
    isSticky = false;
    public scroll = inject(ScrollService)
    public layout = inject(LayoutStoreService)

    navItems = ['Home', 'Services', 'Features', 'Plans', 'Reviews', 'Contact'];
    appName = 'SellenticAI';

    logoWhite = LOGO_WHITE;
    logoColor = LOGO_COLOR;

    @HostListener('window:scroll', [])
    onWindowScroll() {
        const scroll = window.scrollY || window.pageYOffset;
        this.isSticky = scroll > 100;
    }

    toggleTheme() {
        if (this.layout.theme === 'light') {
            this.layout.setTheme('dark')
        } else {
            this.layout.setTheme('light')
        }
    }
}

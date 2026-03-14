import {Component, inject, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MenuItemType} from '@/app/types/layout';
import {CommonModule} from '@angular/common';
import {NgIcon} from '@ng-icons/core';
import {NgbCollapse} from '@ng-bootstrap/ng-bootstrap';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {filter} from 'rxjs';
import {scrollToElement} from '@/app/utils/layout-utils';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {UserMenuService} from '@core/services/user-menu.service';
import {LucideAngularModule} from 'lucide-angular';

@Component({
    selector: 'app-menu',
    imports: [NgIcon, NgbCollapse, RouterLink, CommonModule, LucideAngularModule],
    templateUrl: './app-menu.html'
})
export class AppMenu implements OnInit {

    router = inject(Router)
    layout = inject(LayoutStoreService)
    userMenuService = inject(UserMenuService)

    @Input() searchQuery = '';

    @ViewChild('MenuItemWithChildren', {static: true})
    menuItemWithChildren!: TemplateRef<{ item: MenuItemType }>;

    @ViewChild('MenuItem', {static: true})
    menuItem!: TemplateRef<{ item: MenuItemType }>;

    get menuItems(): MenuItemType[] {
        const items = this.userMenuService.userMenuItems;
        if (!this.searchQuery?.trim()) return items;
        return this.filterMenuItems(items, this.searchQuery.trim().toLowerCase());
    }

    private filterMenuItems(items: MenuItemType[], query: string): MenuItemType[] {
        const result: MenuItemType[] = [];
        for (const item of items) {
            if (item.isTitle) continue;
            const labelMatch = item.label?.toLowerCase().includes(query);
            if (item.children) {
                const filteredChildren = this.filterMenuItems(item.children, query);
                if (labelMatch || filteredChildren.length > 0) {
                    result.push({...item, children: filteredChildren.length > 0 ? filteredChildren : item.children, isCollapsed: false});
                }
            } else if (labelMatch) {
                result.push(item);
            }
        }
        return result;
    }

    async ngOnInit(): Promise<void> {
        // Sayfa yenilemede token varsa ve menüler yüklenmemişse yükle
        if (!this.userMenuService.loaded) {
            const token = localStorage.getItem('accessToken');
            if (token) {
                await this.userMenuService.loadUserMenus();
            }
        }

        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.expandActivePaths(this.menuItems);
                setTimeout(() => this.scrollToActiveLink(), 50);
            });

        this.expandActivePaths(this.menuItems);
        setTimeout(() => this.scrollToActiveLink(), 100);
    }

    hasSubMenu(item: MenuItemType): boolean {
        return !!item.children;
    }

    toggleMenu(item: MenuItemType, siblings: MenuItemType[]): void {
        if (!this.hasSubMenu(item)) return;
        siblings.forEach(sibling => {
            if (sibling !== item) sibling.isCollapsed = true;
        });
        item.isCollapsed = !item.isCollapsed;
    }

    expandActivePaths(items: MenuItemType[]) {
        for (const item of items) {
            if (this.hasSubMenu(item)) {
                item.isCollapsed = !this.isChildActive(item);
                this.expandActivePaths(item.children || []);
            }
        }
    }

    isChildActive(item: MenuItemType): boolean {
        if (this.isRouteActive(item.url)) return true;
        if (!item.children) return false;
        return item.children.some((child: MenuItemType) => this.isChildActive(child));
    }

    isActive(item: MenuItemType): boolean {
        return this.isRouteActive(item.url);
    }

    private isRouteActive(url?: string): boolean {
        if (!url) return false;
        return this.router.isActive(url, false);
    }

    scrollToActiveLink(): void {
        const activeItem = document.querySelector('[data-active-link="true"]') as HTMLElement;
        const scrollContainer = document.querySelector("#sidenav .simplebar-content-wrapper") as HTMLElement;

        if (activeItem && scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const itemRect = activeItem.getBoundingClientRect();

            const offset = itemRect.top - containerRect.top - window.innerHeight * 0.4;

            scrollToElement(scrollContainer, scrollContainer.scrollTop + offset, 500);
        }
    }

}

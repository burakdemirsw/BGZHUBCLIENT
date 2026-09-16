import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NavItemComponent } from './nav-item';
import { SidebarSectionComponent } from './sidebar-section';
import { UserProfileComponent } from './user-profile';

export interface NavEntry {
    id: 'new-chat' | 'dashboard';
    label: string;
    icon: string;
}

export interface ChatHistoryEntry {
    id: string;
    label: string;
    preview?: string;
    dateText?: string;
}

@Component({
    selector: 'nac-sidebar',
    standalone: true,
    imports: [NavItemComponent, SidebarSectionComponent, UserProfileComponent],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.scss'
})
export class SidebarComponent {
    @Input() collapsed = false;
    @Input() mobileOpen = false;
    @Input() chats: ChatHistoryEntry[] = [];
    @Input() hasMoreChats = false;
    @Input() isLoadingMoreChats = false;
    @Input() activeChatId: string | null = null;

    @Output() toggleCollapse = new EventEmitter<void>();
    @Output() closeMobile = new EventEmitter<void>();
    @Output() newChat = new EventEmitter<void>();
    @Output() reloadChats = new EventEmitter<void>();
    @Output() selectChat = new EventEmitter<string>();
    @Output() loadMoreChats = new EventEmitter<void>();

    readonly mainNav: NavEntry[] = [
        { id: 'new-chat', label: 'Yeni sohbet', icon: 'fa-regular fa-pen-to-square' },
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-house' },
    ];

    private lastLoadMoreEmitAt = 0;

    constructor(private router: Router) {}

    onNavClick(entry: NavEntry): void {
        if (entry.id === 'new-chat') {
            this.newChat.emit();
        } else {
            void this.router.navigate(['/dashboard']);
        }
    }

    onBodyScroll(event: Event): void {
        if (!this.hasMoreChats || this.isLoadingMoreChats) return;

        const container = event.target as HTMLElement;
        const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
        const now = Date.now();
        if (remaining > 64 || now - this.lastLoadMoreEmitAt < 250) return;

        this.lastLoadMoreEmitAt = now;
        this.loadMoreChats.emit();
    }
}

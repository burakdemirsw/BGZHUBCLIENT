import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NavItemComponent } from './nav-item';
import { SidebarSectionComponent } from './sidebar-section';
import { UserProfileComponent } from './user-profile';

export interface NavEntry {
    id: string;
    label: string;
    iconSvg: string;
    badge?: string;
}

export interface PinnedEntry {
    id: string;
    label: string;
    iconSvg: string;
}

export interface ChatHistoryEntry {
    id: string;
    label: string;
}

const ICON_PLUS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>`;
const ICON_IMAGE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>`;
const ICON_BOOK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`;
const ICON_CLOCK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`;
const ICON_PLUG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M7 8h10v4a5 5 0 0 1-10 0V8z"/><path d="M12 17v5"/></svg>`;
const ICON_CODE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6"/><path d="M8 6l-6 6 6 6"/></svg>`;
const ICON_DOTS = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>`;
const ICON_PIN = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 6 6 1-4.5 4 1 6L12 16l-5.5 3 1-6L3 9l6-1z"/></svg>`;
const ICON_CIRCLE = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/></svg>`;
const ICON_REFRESH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>`;
const ICON_SEARCH = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`;
const ICON_SIDEBAR = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/></svg>`;

@Component({
    selector: 'nac-sidebar',
    standalone: true,
    imports: [CommonModule, NavItemComponent, SidebarSectionComponent, UserProfileComponent],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.scss'
})
export class SidebarComponent {
    @Input() collapsed = false;
    @Input() mobileOpen = false;
    @Input() chats: ChatHistoryEntry[] = [];
    @Input() activeChatId: string | null = null;

    @Output() toggleCollapse = new EventEmitter<void>();
    @Output() closeMobile = new EventEmitter<void>();
    @Output() newChat = new EventEmitter<void>();
    @Output() reloadChats = new EventEmitter<void>();
    @Output() selectChat = new EventEmitter<string>();

    readonly iconRefresh = ICON_REFRESH;
    readonly iconSearch = ICON_SEARCH;
    readonly iconSidebar = ICON_SIDEBAR;

    constructor(private sanitizer: DomSanitizer) {}

    get safeSearchIcon(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.iconSearch);
    }

    get safeRefreshIcon(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.iconRefresh);
    }

    get safeSidebarIcon(): SafeHtml {
        return this.sanitizer.bypassSecurityTrustHtml(this.iconSidebar);
    }


    readonly mainNav: NavEntry[] = [  
        { id: 'new-chat', label: 'Yeni sohbet', iconSvg: ICON_PLUS }
        // { id: 'visualize', label: 'Görselleştirme', iconSvg: ICON_IMAGE, badge: 'YENİ' },
        // { id: 'library', label: 'Kitaplık', iconSvg: ICON_BOOK },
        // { id: 'scheduled', label: 'Zamanlanmış', iconSvg: ICON_CLOCK },
        // { id: 'plugins', label: 'Eklentiler', iconSvg: ICON_PLUG },
        // { id: 'codex', label: 'Codex', iconSvg: ICON_CODE },
        // { id: 'more', label: 'Daha fazla', iconSvg: ICON_DOTS }
    ];

    readonly pinned: PinnedEntry[] = [];

    onCollapseClick(): void { this.toggleCollapse.emit(); }
    onCloseMobile(): void { this.closeMobile.emit(); }
    onReloadClick(): void { this.reloadChats.emit(); }

    onNavClick(entry: NavEntry): void {
        if (entry.id === 'new-chat') this.newChat.emit();
    }

    onChatSelect(chat: ChatHistoryEntry): void {
        this.activeChatId = chat.id;
        this.selectChat.emit(chat.id);
    }
}

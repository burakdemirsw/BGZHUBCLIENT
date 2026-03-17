import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle } from '@ng-bootstrap/ng-bootstrap';
import { LucideAngularModule, LucideBell } from 'lucide-angular';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NgClass } from '@angular/common';
import { NotificationsService } from '@core/services/notifications.service';
import { UserMenuService } from '@core/services/user-menu.service';
import { NotificationUser } from '@core/models/notification/notification.models';

@Component({
    selector: 'app-messages-dropdown',
    imports: [
        NgbDropdownMenu,
        NgbDropdownToggle,
        NgbDropdown,
        LucideAngularModule,
        SimplebarAngularModule,
        NgClass,
        NgbDropdownItem,
    ],
    templateUrl: './messages-dropdown.html'
})
export class MessagesDropdown implements OnInit, OnDestroy {

    protected readonly LucideBell = LucideBell;

    private notificationsService = inject(NotificationsService);
    private userMenuService = inject(UserMenuService);

    notifications: NotificationUser[] = [];
    unreadCount = 0;
    private pollInterval: any;

    async ngOnInit(): Promise<void> {
        await this.loadNotifications();
        // Her 30 saniyede bir yeni bildirimleri kontrol et
        // this.pollInterval = setInterval(() => this.loadNotifications(), 30000);
    }

    ngOnDestroy(): void {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    private get userId(): string | null {
        return this.userMenuService.getUserIdFromToken();
    }

    async loadNotifications(): Promise<void> {
        const uid = this.userId;
        if (!uid) return;
        try {
            const [unread, countRes] = await Promise.all([
                this.notificationsService.getUnread(uid),
                this.notificationsService.getUnreadCount(uid),
            ]);
            this.notifications = this.extractArray(unread);
            this.unreadCount = this.parseCount(countRes, this.notifications.length);
        } catch {
            this.notifications = [];
            this.unreadCount = 0;
        }
    }

    private parseCount(res: any, fallback: number): number {
        if (typeof res === 'number') return res;
        if (typeof res === 'string') return parseInt(res, 10) || fallback;
        if (res?.count != null) return res.count;
        if (res?.data != null && typeof res.data === 'number') return res.data;
        if (res?.unreadCount != null) return res.unreadCount;
        return fallback;
    }

    async markAsRead(item: NotificationUser): Promise<void> {
        if (item.isRead) return;
        try {
            await this.notificationsService.markAsRead(item.id);
            item.isRead = true;
            this.unreadCount = Math.max(0, this.unreadCount - 1);
        } catch { /* ignore */ }
    }

    async markAllAsRead(): Promise<void> {
        const uid = this.userId;
        if (!uid) return;
        try {
            await this.notificationsService.markAllAsRead(uid);
            this.notifications.forEach(n => n.isRead = true);
            this.unreadCount = 0;
        } catch { /* ignore */ }
    }

    getTimeAgo(dateStr?: string): string {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMin = Math.floor(diffMs / 60000);

        if (diffMin < 1) return 'Az önce';
        if (diffMin < 60) return `${diffMin} dakika önce`;
        const diffHour = Math.floor(diffMin / 60);
        if (diffHour < 24) return `${diffHour} saat önce`;
        const diffDay = Math.floor(diffHour / 24);
        if (diffDay === 1) return 'Dün';
        if (diffDay < 7) return `${diffDay} gün önce`;
        return date.toLocaleDateString('tr-TR');
    }

    getTitle(item: any): string {
        return item.notificationTitle || 'Bildirim';
    }

    getMessage(item: any): string {
        return item.notificationMessage || '';
    }

    getNotificationIcon(item: any): string {
        return 'fa-solid fa-bell';
    }

    getNotificationVariant(item: any): string {
        return item.isRead ? 'secondary' : 'primary';
    }

    private extractArray(res: any): NotificationUser[] {
        if (Array.isArray(res)) return res;
        if (res?.$values && Array.isArray(res.$values)) return res.$values;
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (res?.data?.$values && Array.isArray(res.data.$values)) return res.data.$values;
        return [];
    }
}

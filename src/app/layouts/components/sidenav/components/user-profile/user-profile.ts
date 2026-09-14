import {Component, computed, CUSTOM_ELEMENTS_SCHEMA, OnInit} from '@angular/core';
import {RouterLink} from '@angular/router';
import {NgbCollapseModule, NgbDropdown, NgbDropdownMenu, NgbDropdownToggle} from '@ng-bootstrap/ng-bootstrap';
import {NgIcon} from '@ng-icons/core';
import {userDropdownItems} from '@layouts/components/data';
import {AuthStateService} from '@/app/core/services/auth-state.service';
import {UserService} from '@/app/core/services/user.service';
import {LayoutStoreService} from '@core/services/layout-store.service';
import {NotificationsService} from '@core/services/notifications.service';
import {SubscriptionsService} from '@/app/core/services/subscriptions.service';
import {CompanySubscriptionDetailResponse} from '@/app/core/models/subscription/subscription.models';

@Component({
  selector: 'app-user-profile',
  imports: [
    RouterLink,
    NgbCollapseModule,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgIcon
  ],

  templateUrl: './user-profile.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UserProfile implements OnInit {
  menuItems = userDropdownItems;
  unreadCount = 0;
  subscriptionDetail: CompanySubscriptionDetailResponse | null = null;
  theme = computed(() => this.layout.state().theme);

  constructor(
    public authState: AuthStateService,
    private userService: UserService,
    public layout: LayoutStoreService,
    private notificationsService: NotificationsService,
    private subscriptionsService: SubscriptionsService
  ) {}

  get activePlan() {
    return this.authState.activePlan;
  }

  ngOnInit(): void {
    this.loadUnreadCount();
    this.loadSubscriptionDetail();
  }

  async loadSubscriptionDetail(): Promise<void> {
    try {
      const companyId = this.authState.profile?.companyId;
      if (!companyId) return;
      const response = await this.subscriptionsService.getCompanyDetail(companyId);
      this.subscriptionDetail = response?.data ?? null;
    } catch {
      this.subscriptionDetail = null;
    }
  }

  async loadUnreadCount(): Promise<void> {
    try {
      const userId = this.authState.profile?.userId;
      if (!userId) return;
      const response = await this.notificationsService.getUnreadCount(userId);
      const value = response?.data;
      if (typeof value === 'number') {
        this.unreadCount = value;
      } else if ((value as any)?.count !== undefined) {
        this.unreadCount = (value as any).count;
      } else {
        this.unreadCount = 0;
      }
    } catch {
      this.unreadCount = 0;
    }
  }

  toggleTheme(): void {
    const current = this.layout.theme;
    this.layout.setTheme(current === 'dark' ? 'light' : 'dark');
  }

  get isDark(): boolean {
    return this.layout.theme === 'dark';
  }

  getRemainingDays(): number {
    return this.subscriptionDetail?.daysRemaining ?? 0;
  }

  formatNumber(num: number): string {
    return num.toLocaleString('tr-TR');
  }

  onItemClick(item: any, event: Event): void {
    if (item.label === 'Çıkış Yap') {
      event.preventDefault();
      this.userService.logout();
    }
  }
}

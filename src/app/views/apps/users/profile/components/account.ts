import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Settings } from '@/app/views/apps/users/profile/components/settings';
import { About } from '@/app/views/apps/users/profile/components/about';
import { NgbNav, NgbNavContent, NgbNavItem, NgbNavLink, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap';
import { NgIcon } from '@ng-icons/core';
import { UserResponse } from '@core/models/user/user.models';

@Component({
  selector: 'app-account',
    imports: [
        Settings,
        About,
        NgbNav,
        NgbNavItem,
        NgbNavLink,
        NgIcon,
        NgbNavContent,
        NgbNavOutlet
    ],
  template: `
      <div class="card">
          <div class="card-header card-tabs d-flex align-items-center">
              <div class="flex-grow-1">
                  <h4 class="card-title">Hesabım</h4>
              </div>
              <ul ngbNav #nav="ngbNav" [(activeId)]="activeId" class="nav nav-tabs card-header-tabs nav-bordered">
                  <li ngbNavItem="about">
                      <a href="javascript:void(0);" ngbNavLink>
                          <ng-icon name="tablerHome" class="d-md-none d-block"/>
                          <span class="d-none d-md-block fw-bold">Hakkımda</span>
                      </a>
                      <ng-template ngbNavContent>
                          <app-about [user]="user"/>
                      </ng-template>
                  </li>
                  <li ngbNavItem="settings">
                      <a href="javascript:void(0);" ngbNavLink>
                          <ng-icon name="tablerSettings" class="d-md-none d-block"/>
                          <span class="d-none d-md-block fw-bold">Ayarlar</span>
                      </a>
                      <ng-template ngbNavContent>
                          <app-settings [user]="user" (profileUpdated)="onProfileUpdated()"/>
                      </ng-template>
                  </li>
              </ul>
          </div>

          <div class="card-body">
              <div class="tab-content" [ngbNavOutlet]="nav"></div>
          </div>
      </div>
  `,
  styles: ``
})
export class Account {
    @Input() user: UserResponse | null = null;
    @Output() profileUpdated = new EventEmitter<void>();
    activeId = 'about';

    onProfileUpdated(): void {
        this.profileUpdated.emit();
    }
}

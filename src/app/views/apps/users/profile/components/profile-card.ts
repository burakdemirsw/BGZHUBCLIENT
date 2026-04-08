import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { UserResponse } from '@core/models/user/user.models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-profile-card',
    imports: [
        RouterLink,
        NgIcon,
        DatePipe
    ],
  template: `
      <div class="card card-top-sticky">
          <div class="card-body">
              <div class="d-flex align-items-center mb-4">
                  <div class="me-3 position-relative">
                      @if (user?.photoUrl) {
                          <img [src]="user!.photoUrl" alt="avatar" class="rounded-circle" width="72" height="72">
                      } @else {
                          <div class="avatar-lg rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                               style="width: 72px; height: 72px; font-size: 1.5rem; font-weight: 600;">
                              {{ getInitials() }}
                          </div>
                      }
                  </div>
                  <div>
                      <h5 class="mb-0 d-flex align-items-center">
                          <a [routerLink]="[]" class="link-reset">{{ user?.name }} {{ user?.lastName }}</a>
                      </h5>
                      <p class="text-muted mb-2">{{ user?.email }}</p>
                      @if (user?.isBlocked) {
                          <span class="badge bg-danger-subtle text-danger">Engelli</span>
                      } @else {
                          <span class="badge bg-success-subtle text-success">Aktif</span>
                      }
                      @if (user?.isMailConfirmed) {
                          <span class="badge bg-success-subtle text-success ms-1">
                              <ng-icon name="tablerCheck" class="fs-xs me-1"/>E-posta Onaylı
                          </span>
                      } @else {
                          <span class="badge bg-warning-subtle text-warning ms-1">
                              <ng-icon name="tablerAlertCircle" class="fs-xs me-1"/>E-posta Onaylanmadı
                          </span>
                      }
                  </div>
              </div>

              <div>
                  @if (user?.email) {
                      <div class="d-flex align-items-center gap-2 mb-2">
                          <div class="avatar-sm text-bg-light bg-opacity-75 d-flex align-items-center justify-content-center rounded-circle">
                              <ng-icon name="tablerMail" class="fs-xl"/>
                          </div>
                          <p class="mb-0 fs-sm">
                              <a [href]="'mailto:' + user!.email" class="text-primary fw-semibold">{{ user!.email }}</a>
                          </p>
                      </div>
                  }
                  @if (user?.phoneNumber) {
                      <div class="d-flex align-items-center gap-2 mb-2">
                          <div class="avatar-sm text-bg-light bg-opacity-75 d-flex align-items-center justify-content-center rounded-circle">
                              <ng-icon name="tablerPhone" class="fs-xl"/>
                          </div>
                          <p class="mb-0 fs-sm text-dark fw-semibold">{{ user!.phoneNumber }}</p>
                      </div>
                  }
                  @if (user?.gender) {
                      <div class="d-flex align-items-center gap-2 mb-2">
                          <div class="avatar-sm text-bg-light bg-opacity-75 d-flex align-items-center justify-content-center rounded-circle">
                              <ng-icon name="tablerUser" class="fs-xl"/>
                          </div>
                          <p class="mb-0 fs-sm">Cinsiyet: <span class="text-dark fw-semibold">{{ user!.gender }}</span></p>
                      </div>
                  }
                  @if (user?.lastLoginDate) {
                      <div class="d-flex align-items-center gap-2 mb-2">
                          <div class="avatar-sm text-bg-light bg-opacity-75 d-flex align-items-center justify-content-center rounded-circle">
                              <ng-icon name="tablerLogin" class="fs-xl"/>
                          </div>
                          <p class="mb-0 fs-sm">Son Giriş: <span class="text-dark fw-semibold">{{ user!.lastLoginDate | date:'dd.MM.yyyy HH:mm' }}</span></p>
                      </div>
                  }
                  @if (user?.createdDate) {
                      <div class="d-flex align-items-center gap-2 mb-2">
                          <div class="avatar-sm text-bg-light bg-opacity-75 d-flex align-items-center justify-content-center rounded-circle">
                              <ng-icon name="tablerCalendar" class="fs-xl"/>
                          </div>
                          <p class="mb-0 fs-sm">Kayıt Tarihi: <span class="text-dark fw-semibold">{{ user!.createdDate | date:'dd.MM.yyyy' }}</span></p>
                      </div>
                  }
              </div>
          </div>
      </div>
  `,
  styles: ``
})
export class ProfileCard {
    @Input() user: UserResponse | null = null;

    getInitials(): string {
        const n = this.user?.name?.charAt(0) ?? '';
        const l = this.user?.lastName?.charAt(0) ?? '';
        return (n + l).toUpperCase();
    }
}

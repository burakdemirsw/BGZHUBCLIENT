import { Component, Input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { UserResponse } from '@core/models/user/user.models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-about',
    imports: [
        NgIcon,
        DatePipe
    ],
  template: `
      @if (user) {
          <div class="row mb-4">
              <div class="col-md-6">
                  <h5 class="text-uppercase fs-sm text-muted mb-3">
                      <ng-icon name="tablerUser" class="me-1"/> Kişisel Bilgiler
                  </h5>
                  <div class="table-responsive">
                      <table class="table table-borderless mb-0">
                          <tbody>
                              <tr>
                                  <td class="text-muted fw-medium" style="width: 140px;">Ad</td>
                                  <td>{{ user.name || '—' }}</td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">Soyad</td>
                                  <td>{{ user.lastName || '—' }}</td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">E-posta</td>
                                  <td>
                                      @if (user.email) {
                                          <a [href]="'mailto:' + user.email" class="text-primary">{{ user.email }}</a>
                                      } @else {
                                          —
                                      }
                                  </td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">Telefon</td>
                                  <td>{{ user.phoneNumber || '—' }}</td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">Cinsiyet</td>
                                  <td>{{ user.gender || '—' }}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
              <div class="col-md-6">
                  <h5 class="text-uppercase fs-sm text-muted mb-3">
                      <ng-icon name="tablerInfoCircle" class="me-1"/> Hesap Bilgileri
                  </h5>
                  <div class="table-responsive">
                      <table class="table table-borderless mb-0">
                          <tbody>
                              <tr>
                                  <td class="text-muted fw-medium" style="width: 140px;">Durum</td>
                                  <td>
                                      @if (user.isBlocked) {
                                          <span class="badge bg-danger-subtle text-danger">Engelli</span>
                                      } @else {
                                          <span class="badge bg-success-subtle text-success">Aktif</span>
                                      }
                                  </td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">E-posta Onay</td>
                                  <td>
                                      @if (user.isMailConfirmed) {
                                          <span class="badge bg-success-subtle text-success">Onaylı</span>
                                      } @else {
                                          <span class="badge bg-warning-subtle text-warning">Onaylanmadı</span>
                                      }
                                  </td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">Son Giriş</td>
                                  <td>{{ user.lastLoginDate | date:'dd.MM.yyyy HH:mm' }}</td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">Kayıt Tarihi</td>
                                  <td>{{ user.createdDate | date:'dd.MM.yyyy HH:mm' }}</td>
                              </tr>
                              <tr>
                                  <td class="text-muted fw-medium">Güncelleme</td>
                                  <td>{{ user.updatedDate | date:'dd.MM.yyyy HH:mm' }}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      }
  `,
  styles: ``
})
export class About {
    @Input() user: UserResponse | null = null;
}

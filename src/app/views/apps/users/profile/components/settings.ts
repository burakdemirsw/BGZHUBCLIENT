import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { FormsModule } from '@angular/forms';
import { UserResponse, UpdateUserRequest } from '@core/models/user/user.models';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-settings',
    imports: [
        NgIcon,
        FormsModule,
    ],
  template: `
      @if (user) {
          <form (ngSubmit)="onSubmit()">

              <h5 class="mb-3 text-uppercase bg-light-subtle p-1 border-dashed border rounded border-light text-center">
                  <ng-icon name="tablerUserCircle" class="me-1"/> Kişisel Bilgiler</h5>
              <div class="row">
                  <div class="col-md-6">
                      <div class="mb-3">
                          <label for="firstname" class="form-label">Ad</label>
                          <input type="text" class="form-control" id="firstname"
                                 [(ngModel)]="formModel.name" name="name"
                                 placeholder="Adınızı girin">
                      </div>
                  </div>
                  <div class="col-md-6">
                      <div class="mb-3">
                          <label for="lastname" class="form-label">Soyad</label>
                          <input type="text" class="form-control" id="lastname"
                                 [(ngModel)]="formModel.lastName" name="lastName"
                                 placeholder="Soyadınızı girin">
                      </div>
                  </div>
              </div>

              <div class="row">
                  <div class="col-md-6">
                      <div class="mb-3">
                          <label for="phone" class="form-label">Telefon</label>
                          <input type="text" class="form-control" id="phone"
                                 [(ngModel)]="formModel.phoneNumber" name="phoneNumber"
                                 placeholder="+90 5XX XXX XXXX">
                      </div>
                  </div>
                  <div class="col-md-6">
                      <div class="mb-3">
                          <label for="gender" class="form-label">Cinsiyet</label>
                          <select class="form-select" id="gender"
                                  [(ngModel)]="formModel.gender" name="gender">
                              <option value="">Seçiniz</option>
                              <option value="Erkek">Erkek</option>
                              <option value="Kadın">Kadın</option>
                              <option value="Diğer">Diğer</option>
                          </select>
                      </div>
                  </div>
              </div>

              <div class="row">
                  <div class="col-md-6">
                      <div class="mb-3">
                          <label for="useremail" class="form-label">E-posta Adresi</label>
                          <input type="email" class="form-control" id="useremail"
                                 [value]="user.email || ''" disabled
                                 placeholder="E-posta adresi">
                          <span class="form-text fs-xs fst-italic text-muted">E-posta adresi değiştirilemez</span>
                      </div>
                  </div>
                  <div class="col-md-6">
                      <div class="mb-3">
                          <label for="photoUrl" class="form-label">Profil Fotoğrafı URL</label>
                          <input type="text" class="form-control" id="photoUrl"
                                 [(ngModel)]="formModel.photoUrl" name="photoUrl"
                                 placeholder="https://example.com/photo.jpg">
                      </div>
                  </div>
              </div>

              @if (successMessage) {
                  <div class="alert alert-success alert-dismissible fade show" role="alert">
                      <ng-icon name="tablerCheck" class="me-1"/>
                      {{ successMessage }}
                      <button type="button" class="btn-close" (click)="successMessage = ''"></button>
                  </div>
              }

              @if (errorMessage) {
                  <div class="alert alert-danger alert-dismissible fade show" role="alert">
                      <ng-icon name="tablerAlertCircle" class="me-1"/>
                      {{ errorMessage }}
                      <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
                  </div>
              }

              <div class="text-end mt-4">
                  <button type="submit" class="btn btn-success" [disabled]="saving">
                      <ng-icon name="tablerDeviceFloppy" class="me-1"/>
                      {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
                  </button>
              </div>
          </form>
      }
  `,
  styles: ``
})
export class Settings implements OnChanges {
    @Input() user: UserResponse | null = null;
    @Output() profileUpdated = new EventEmitter<void>();

    formModel: UpdateUserRequest = {
        name: '',
        lastName: '',
        gender: '',
        isBlocked: false,
        phoneNumber: null,
        photoUrl: null
    };

    saving = false;
    successMessage = '';
    errorMessage = '';

    constructor(private userService: UserService) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['user'] && this.user) {
            this.formModel = {
                name: this.user.name || '',
                lastName: this.user.lastName || '',
                gender: this.user.gender || '',
                isBlocked: this.user.isBlocked,
                phoneNumber: this.user.phoneNumber || null,
                photoUrl: this.user.photoUrl || null
            };
        }
    }

    async onSubmit(): Promise<void> {
        if (!this.user) return;
        this.saving = true;
        this.successMessage = '';
        this.errorMessage = '';
        try {
            const response = await this.userService.updateUser(this.user.id, this.formModel);
            if (response.isSuccess) {
                this.successMessage = 'Profil bilgileri başarıyla güncellendi.';
                this.profileUpdated.emit();
            } else {
                this.errorMessage = response.errorCode || 'Güncelleme sırasında bir hata oluştu.';
            }
        } catch {
            this.errorMessage = 'Profil güncellenirken bir hata oluştu.';
        } finally {
            this.saving = false;
        }
    }
}

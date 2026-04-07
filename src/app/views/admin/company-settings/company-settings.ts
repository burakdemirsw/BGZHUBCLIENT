import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompanySettingsService } from '@/app/core/services/company-settings.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    CompanySetting,
    CreateCompanySettingRequest,
    UpdateCompanySettingRequest,
} from '@/app/core/models/company-setting/company-setting.models';

@Component({
    selector: 'app-company-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './company-settings.html',
})
export class CompanySettingsPage implements OnInit {
    setting: CompanySetting | null = null;
    loading = false;
    saving = false;
    successMessage = '';
    errorMessage = '';

    form = {
        isTwoFactorAuthEnabled: false,
        isAutoReplyEnabled: false,
        isUseWorkHours: false,
        workHoursStart: '09:00' as string | null,
        workHoursEnd: '18:00' as string | null,
    };

    private companyId = '';

    constructor(
        private companySettingsService: CompanySettingsService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.companyId = this.authStateService.profile?.companyId || '';
        this.loadSetting();
    }

    async loadSetting(): Promise<void> {
        if (!this.companyId) {
            this.errorMessage = 'Şirket bilgisi bulunamadı.';
            return;
        }

        this.loading = true;
        this.errorMessage = '';
        try {
            const response = await this.companySettingsService.getByCompany(this.companyId);
            const data = this.extractData(response);
            if (data) {
                this.setting = data;
                this.form = {
                    isTwoFactorAuthEnabled: data.isTwoFactorAuthEnabled,
                    isAutoReplyEnabled: data.isAutoReplyEnabled,
                    isUseWorkHours: data.isUseWorkHours ?? false,
                    workHoursStart: data.workHoursStart ?? '09:00',
                    workHoursEnd: data.workHoursEnd ?? '18:00',
                };
            }
        } catch (err: any) {
            console.error('CompanySettings load error:', err);
            // Eğer henüz ayar yoksa sorun yok, create edilecek
            this.setting = null;
        } finally {
            this.loading = false;
        }
    }

    async save(): Promise<void> {
        this.saving = true;
        this.successMessage = '';
        this.errorMessage = '';

        try {
            if (this.setting) {
                // Update
                const req: UpdateCompanySettingRequest = {
                    isTwoFactorAuthEnabled: this.form.isTwoFactorAuthEnabled,
                    isAutoReplyEnabled: this.form.isAutoReplyEnabled,
                    isUseWorkHours: this.form.isUseWorkHours,
                    workHoursStart: this.form.isUseWorkHours ? this.form.workHoursStart : null,
                    workHoursEnd: this.form.isUseWorkHours ? this.form.workHoursEnd : null,
                };
                await this.companySettingsService.update(this.setting.id, req);
                this.successMessage = 'Ayarlar başarıyla güncellendi.';
            } else {
                // Create
                const req: CreateCompanySettingRequest = {
                    companyId: this.companyId,
                    isTwoFactorAuthEnabled: this.form.isTwoFactorAuthEnabled,
                    isAutoReplyEnabled: this.form.isAutoReplyEnabled,
                    isUseWorkHours: this.form.isUseWorkHours,
                    workHoursStart: this.form.isUseWorkHours ? this.form.workHoursStart : null,
                    workHoursEnd: this.form.isUseWorkHours ? this.form.workHoursEnd : null,
                };
                await this.companySettingsService.create(req);
                this.successMessage = 'Ayarlar başarıyla oluşturuldu.';
            }
            await this.loadSetting();
        } catch (err: any) {
            console.error('CompanySettings save error:', err);
            this.errorMessage = 'Ayarlar kaydedilirken hata oluştu.';
        } finally {
            this.saving = false;
        }
    }

    private extractData(response: any): CompanySetting | null {
        if (!response) return null;
        if (response.data) return response.data;
        if (response.result) return response.result;
        if (response.id) return response;
        return null;
    }
}

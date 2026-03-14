import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MailSettingsService } from '@/app/core/services/mail-settings.service';
import { MailSetting, CreateMailSettingRequest, UpdateMailSettingRequest } from '@/app/core/models/mail/mail.models';

@Component({
    selector: 'app-mail-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './mail-settings.html',
})
export class MailSettingsPage implements OnInit {
    settings: MailSetting[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedSetting: MailSetting | null = null;

    form: any = {
        userName: '',
        password: '',
        applicationPassword: '',
        smtpAddress: '',
        smtpPort: 587,
        isFirst: false,
        isBlocked: false,
    };

    constructor(private mailService: MailSettingsService) {}

    ngOnInit(): void {
        this.loadSettings();
    }

    async loadSettings(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.mailService.getAll();
            console.log('MailSettings response:', response);
            this.settings = this.extractArray(response);
        } catch (err) {
            console.error('MailSettings error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedSetting = null;
        this.form = { userName: '', password: '', applicationPassword: '', smtpAddress: '', smtpPort: 587, isFirst: false, isBlocked: false };
        this.showModal = true;
    }

    openEdit(setting: MailSetting): void {
        this.editMode = true;
        this.selectedSetting = setting;
        this.form = {
            userName: setting.userName,
            password: setting.password,
            applicationPassword: setting.applicationPassword,
            smtpAddress: setting.smtpAddress,
            smtpPort: setting.smtpPort,
            isFirst: setting.isFirst,
            isBlocked: setting.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedSetting) {
                const req: UpdateMailSettingRequest = {
                    userName: this.form.userName,
                    password: this.form.password,
                    applicationPassword: this.form.applicationPassword,
                    smtpAddress: this.form.smtpAddress,
                    smtpPort: this.form.smtpPort,
                    isFirst: this.form.isFirst,
                    isBlocked: this.form.isBlocked,
                };
                await this.mailService.update(this.selectedSetting.id, req);
            } else {
                const req: CreateMailSettingRequest = {
                    userName: this.form.userName,
                    password: this.form.password,
                    applicationPassword: this.form.applicationPassword,
                    smtpAddress: this.form.smtpAddress,
                    smtpPort: this.form.smtpPort,
                    isFirst: this.form.isFirst,
                };
                await this.mailService.create(req);
            }
            this.showModal = false;
            await this.loadSettings();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteSetting(setting: MailSetting): Promise<void> {
        if (confirm(`"${setting.userName}" mail ayarını silmek istediğinize emin misiniz?`)) {
            try {
                await this.mailService.delete(setting.id);
                await this.loadSettings();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

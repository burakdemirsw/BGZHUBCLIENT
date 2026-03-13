import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { MailSettingsService } from '@/app/core/services/mail-settings.service';
import { MailSetting, CreateMailSettingRequest, UpdateMailSettingRequest } from '@/app/core/models/mail/mail.models';

@Component({
    selector: 'app-mail-settings-page',
    imports: [CommonModule, FormsModule, PageTitle],
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

    loadSettings(): void {
        this.loading = true;
        this.mailService.getAll().subscribe({
            next: (data) => {
                this.settings = data;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
            },
        });
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

    save(): void {
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
            this.mailService.update(this.selectedSetting.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadSettings();
                },
            });
        } else {
            const req: CreateMailSettingRequest = {
                userName: this.form.userName,
                password: this.form.password,
                applicationPassword: this.form.applicationPassword,
                smtpAddress: this.form.smtpAddress,
                smtpPort: this.form.smtpPort,
                isFirst: this.form.isFirst,
            };
            this.mailService.create(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadSettings();
                },
            });
        }
    }

    deleteSetting(setting: MailSetting): void {
        if (confirm(`"${setting.userName}" mail ayarını silmek istediğinize emin misiniz?`)) {
            this.mailService.delete(setting.id).subscribe({
                next: () => this.loadSettings(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

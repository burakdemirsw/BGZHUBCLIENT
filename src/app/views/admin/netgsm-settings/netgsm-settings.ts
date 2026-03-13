import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { NetGsmSettingsService } from '@/app/core/services/netgsm-settings.service';
import { NetGsmSetting, CreateNetGsmSettingRequest, UpdateNetGsmSettingRequest } from '@/app/core/models/netgsm/netgsm.models';

@Component({
    selector: 'app-netgsm-settings-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './netgsm-settings.html',
})
export class NetGsmSettingsPage implements OnInit {
    settings: NetGsmSetting[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedSetting: NetGsmSetting | null = null;

    form: any = {
        applicationId: '',
        userName: '',
        password: '',
        messageHeader: '',
        isFirst: false,
        isBlocked: false,
    };

    constructor(private netGsmService: NetGsmSettingsService) {}

    ngOnInit(): void {
        this.loadSettings();
    }

    loadSettings(): void {
        this.loading = true;
        this.netGsmService.getAll().subscribe({
            next: (response: any) => {
                console.log('NetGsmSettings response:', response);
                this.settings = this.extractArray(response);
                this.loading = false;
            },
            error: (err) => {
                console.error('NetGsmSettings error:', err);
                this.loading = false;
            },
        });
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
        this.form = { applicationId: '', userName: '', password: '', messageHeader: '', isFirst: false, isBlocked: false };
        this.showModal = true;
    }

    openEdit(setting: NetGsmSetting): void {
        this.editMode = true;
        this.selectedSetting = setting;
        this.form = {
            applicationId: setting.applicationId,
            userName: setting.userName,
            password: setting.password,
            messageHeader: setting.messageHeader,
            isFirst: setting.isFirst,
            isBlocked: setting.isBlocked,
        };
        this.showModal = true;
    }

    save(): void {
        if (this.editMode && this.selectedSetting) {
            const req: UpdateNetGsmSettingRequest = {
                applicationId: this.form.applicationId,
                userName: this.form.userName,
                password: this.form.password,
                messageHeader: this.form.messageHeader,
                isFirst: this.form.isFirst,
                isBlocked: this.form.isBlocked,
            };
            this.netGsmService.update(this.selectedSetting.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadSettings();
                },
            });
        } else {
            const req: CreateNetGsmSettingRequest = {
                applicationId: this.form.applicationId,
                userName: this.form.userName,
                password: this.form.password,
                messageHeader: this.form.messageHeader,
                isFirst: this.form.isFirst,
            };
            this.netGsmService.create(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadSettings();
                },
            });
        }
    }

    deleteSetting(setting: NetGsmSetting): void {
        if (confirm(`"${setting.userName}" NetGsm ayarını silmek istediğinize emin misiniz?`)) {
            this.netGsmService.delete(setting.id).subscribe({
                next: () => this.loadSettings(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

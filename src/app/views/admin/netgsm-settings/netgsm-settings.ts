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

    async loadSettings(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.netGsmService.getAll();
            console.log('NetGsmSettings response:', response);
            this.settings = this.extractArray(response);
        } catch (err) {
            console.error('NetGsmSettings error:', err);
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

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedSetting) {
                const req: UpdateNetGsmSettingRequest = {
                    applicationId: this.form.applicationId,
                    userName: this.form.userName,
                    password: this.form.password,
                    messageHeader: this.form.messageHeader,
                    isFirst: this.form.isFirst,
                    isBlocked: this.form.isBlocked,
                };
                await this.netGsmService.update(this.selectedSetting.id, req);
            } else {
                const req: CreateNetGsmSettingRequest = {
                    applicationId: this.form.applicationId,
                    userName: this.form.userName,
                    password: this.form.password,
                    messageHeader: this.form.messageHeader,
                    isFirst: this.form.isFirst,
                };
                await this.netGsmService.create(req);
            }
            this.showModal = false;
            await this.loadSettings();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteSetting(setting: NetGsmSetting): Promise<void> {
        if (confirm(`"${setting.userName}" NetGsm ayarını silmek istediğinize emin misiniz?`)) {
            try {
                await this.netGsmService.delete(setting.id);
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

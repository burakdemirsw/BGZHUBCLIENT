import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AiSetting, CreateAiSettingRequest, UpdateAiSettingRequest } from '@/app/core/models/ai-assistant/ai-setting.models';

@Component({
    selector: 'app-ai-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-settings.html',
})
export class AiSettingsPage implements OnInit {
    settings: AiSetting[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedSetting: AiSetting | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: AiSetting[] = [];
    pagedItems: AiSetting[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        settingDescription: '',
        definition: '',
        value: '',
        isBlocked: false,
    };

    constructor(private aiService: AiProvidersService) {}

    ngOnInit(): void {
        this.loadSettings();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const filter = (this.filterText || '').toLowerCase();
        this.filteredItems = this.settings.filter(item =>
            (item.settingDescription || '').toLowerCase().includes(filter) ||
            (item.definition || '').toLowerCase().includes(filter) ||
            (item.value || '').toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadSettings(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.aiService.getSettings();
            const data = response?.data || response;
            this.settings = this.extractArray(data?.items || data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiSettings load error:', err);
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
        this.form = { settingDescription: '', definition: '', value: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(setting: AiSetting): void {
        this.editMode = true;
        this.selectedSetting = setting;
        this.form = {
            settingDescription: setting.settingDescription,
            definition: setting.definition ?? '',
            value: setting.value ?? '',
            isBlocked: setting.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedSetting) {
                const req: UpdateAiSettingRequest = {
                    settingDescription: this.form.settingDescription,
                    definition: this.form.definition,
                    value: this.form.value,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateSetting(this.selectedSetting.id, req);
            } else {
                const req: CreateAiSettingRequest = {
                    settingDescription: this.form.settingDescription,
                    definition: this.form.definition,
                    value: this.form.value,
                };
                await this.aiService.createSetting(req);
            }
            this.showModal = false;
            await this.loadSettings();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadSettings();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteSetting(setting: AiSetting): Promise<void> {
        if (confirm(`"${setting.settingDescription}" ayarını silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteSetting(setting.id);
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

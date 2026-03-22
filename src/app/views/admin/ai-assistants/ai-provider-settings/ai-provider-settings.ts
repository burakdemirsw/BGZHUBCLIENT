import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AiProviderSetting, CreateAiProviderSettingRequest, UpdateAiProviderSettingRequest } from '@/app/core/models/ai-assistant/ai-provider-setting.models';
import { AiProvider } from '@/app/core/models/ai-assistant/ai-provider.models';
import { AiSetting } from '@/app/core/models/ai-assistant/ai-setting.models';

@Component({
    selector: 'app-ai-provider-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-provider-settings.html',
})
export class AiProviderSettingsPage implements OnInit {
    providerSettings: AiProviderSetting[] = [];
    providers: AiProvider[] = [];
    settings: AiSetting[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedProviderSetting: AiProviderSetting | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: AiProviderSetting[] = [];
    pagedItems: AiProviderSetting[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        aiProviderId: '',
        settingId: '',
    };

    constructor(private aiService: AiProvidersService) {}

    ngOnInit(): void {
        this.loadProviderSettings();
        this.loadProviders();
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
        this.filteredItems = this.providerSettings.filter(item =>
            (item.providerFirmDescription || this.getProviderName(item.aiProviderId)).toLowerCase().includes(filter) ||
            (item.settingDescription || this.getSettingName(item.settingId)).toLowerCase().includes(filter)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadProviderSettings(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.aiService.getProviderSettings();
            this.providerSettings = this.extractArray(response?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AiProviderSettings load error:', err);
        } finally {
            this.loading = false;
        }
    }

    async loadProviders(): Promise<void> {
        try {
            const response = await this.aiService.getProviders();
            this.providers = this.extractArray(response?.data);
        } catch (err) {
            console.error('Providers load error:', err);
        }
    }

    async loadSettings(): Promise<void> {
        try {
            const response = await this.aiService.getSettings();
            this.settings = this.extractArray(response?.data);
        } catch (err) {
            console.error('Settings load error:', err);
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

    getProviderName(providerId: string): string {
        const provider = this.providers.find(p => p.id === providerId);
        return provider?.firmDescription ?? providerId;
    }

    getSettingName(settingId: string): string {
        const setting = this.settings.find(s => s.id === settingId);
        return setting?.settingDescription ?? settingId;
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedProviderSetting = null;
        this.form = { aiProviderId: '', settingId: '' };
        this.showModal = true;
    }

    openEdit(ps: AiProviderSetting): void {
        this.editMode = true;
        this.selectedProviderSetting = ps;
        this.form = {
            aiProviderId: ps.aiProviderId,
            settingId: ps.settingId,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedProviderSetting) {
                const req: UpdateAiProviderSettingRequest = {
                    aiProviderId: this.form.aiProviderId,
                    settingId: this.form.settingId,
                };
                await this.aiService.updateProviderSetting(this.selectedProviderSetting.id, req);
            } else {
                const req: CreateAiProviderSettingRequest = {
                    aiProviderId: this.form.aiProviderId,
                    settingId: this.form.settingId,
                };
                await this.aiService.createProviderSetting(req);
            }
            this.showModal = false;
            await this.loadProviderSettings();
        } catch (err: any) {
            console.error('Save error:', err);
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadProviderSettings();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteProviderSetting(ps: AiProviderSetting): Promise<void> {
        const name = (ps.providerFirmDescription || this.getProviderName(ps.aiProviderId))
            + ' - ' + (ps.settingDescription || this.getSettingName(ps.settingId));
        if (confirm(`"${name}" eşleşmesini silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteProviderSetting(ps.id);
                await this.loadProviderSettings();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

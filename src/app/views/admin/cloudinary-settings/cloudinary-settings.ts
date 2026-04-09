import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CloudinarySettingsService } from '@/app/core/services/cloudinary-settings.service';
import { CloudinarySettingResponse, CreateCloudinarySettingRequest, UpdateCloudinarySettingRequest } from '@/app/core/models/cloudinary/cloudinary.models';

@Component({
    selector: 'app-cloudinary-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './cloudinary-settings.html',
})
export class CloudinarySettingsPage implements OnInit {
    settings: CloudinarySettingResponse[] = [];
    filteredItems: CloudinarySettingResponse[] = [];
    pagedItems: CloudinarySettingResponse[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedSetting: CloudinarySettingResponse | null = null;

    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        cloudName: '',
        apiKey: '',
        apiSecret: '',
        isActive: true,
        isBlocked: false,
    };

    constructor(private cloudinaryService: CloudinarySettingsService) {}

    ngOnInit(): void {
        this.loadSettings();
    }

    async loadSettings(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.cloudinaryService.getAll();
            this.settings = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('CloudinarySettings error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray(response: any): CloudinarySettingResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
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
        const term = this.filterText.toLowerCase();
        this.filteredItems = this.settings.filter(s =>
            s.cloudName?.toLowerCase().includes(term) ||
            s.apiKey?.toLowerCase().includes(term)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedSetting = null;
        this.form = { cloudName: '', apiKey: '', apiSecret: '', isActive: true, isBlocked: false };
        this.showModal = true;
    }

    openEdit(setting: CloudinarySettingResponse): void {
        this.editMode = true;
        this.selectedSetting = setting;
        this.form = {
            cloudName: setting.cloudName,
            apiKey: setting.apiKey,
            apiSecret: setting.apiSecret,
            isActive: setting.isActive,
            isBlocked: setting.isBlocked,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedSetting) {
                const req: UpdateCloudinarySettingRequest = {
                    cloudName: this.form.cloudName,
                    apiKey: this.form.apiKey,
                    apiSecret: this.form.apiSecret,
                    isActive: this.form.isActive,
                    isBlocked: this.form.isBlocked,
                };
                await this.cloudinaryService.update(this.selectedSetting.id, req);
            } else {
                const req: CreateCloudinarySettingRequest = {
                    cloudName: this.form.cloudName,
                    apiKey: this.form.apiKey,
                    apiSecret: this.form.apiSecret,
                    isActive: this.form.isActive,
                };
                await this.cloudinaryService.create(req);
            }
            this.showModal = false;
            await this.loadSettings();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteSetting(setting: CloudinarySettingResponse): Promise<void> {
        if (confirm(`"${setting.cloudName}" Cloudinary ayarını silmek istediğinize emin misiniz?`)) {
            try {
                await this.cloudinaryService.delete(setting.id);
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

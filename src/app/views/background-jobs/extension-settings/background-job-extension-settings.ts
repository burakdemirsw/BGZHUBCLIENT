import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackgroundJobsService } from '@/app/core/services/background-jobs.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import { ExtensionSettingDefinition } from '@/app/core/models/extension/extension-setting-definition.models';
import {
    BackgroundJob,
    BackgroundJobExtensionSetting,
    BackgroundJobSetting,
} from '@/app/core/models/background-jobs/background-jobs.models';

/** Bağlantı satırı + listede gösterilecek iş/ayar adları */
interface ExtensionLinkRow extends BackgroundJobExtensionSetting {
    jobName: string;
    jobSettingName: string;
}

/**
 * Arka Plan Extension Ayarları — iş ayar tanımlarının hangi extension
 * ayarlarına bağlı olduğunu tüm servisler için tek listede gösterir.
 * API'de toplu liste ucu olmadığından her iş ayarı için ayrı istek atılır.
 */
@Component({
    selector: 'app-background-job-extension-settings',
    imports: [FormsModule],
    templateUrl: './background-job-extension-settings.html',
    styleUrls: ['./background-job-extension-settings.scss'],
})
export class BackgroundJobExtensionSettingsPage implements OnInit {
    items: ExtensionLinkRow[] = [];
    jobs: BackgroundJob[] = [];
    loading = false;
    deletingId: string | null = null;

    // ── Liste filtre + sayfalama ──
    filterText = '';
    filteredItems: ExtensionLinkRow[] = [];
    pagedItems: ExtensionLinkRow[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // ── Yeni bağlantı modalı ──
    showModal = false;
    saving = false;
    extensions: ExtensionDefinition[] = [];
    extensionSettingDefs: Record<string, ExtensionSettingDefinition[]> = {};
    form = { jobCode: '', settingKey: '', extensionId: '', extensionSettingDefinitionId: '' };

    constructor(
        private backgroundJobsService: BackgroundJobsService,
        private extensionService: ExtensionManagementService,
    ) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.backgroundJobsService.getJobs();
            this.jobs = this.extractArray<BackgroundJob>(response)
                .sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || '', 'tr'));

            const requests = this.jobs.flatMap(job =>
                (job.settings || [])
                    .filter(setting => job.code && setting.key)
                    .map(setting => this.fetchLinks(job, setting)),
            );
            this.items = (await Promise.all(requests)).flat();
        } catch (err) {
            console.error('BackgroundJob extension settings load error:', err);
            this.items = [];
        } finally {
            this.loading = false;
            this.applyFilterAndPaging();
        }
    }

    // ────────────────────────────── Filtre + sayfalama ──────────────────────────────

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
        const filter = this.filterText.trim().toLocaleLowerCase('tr');
        this.filteredItems = this.items.filter(item =>
            !filter ||
            [item.jobName, item.jobCode, item.jobSettingName, item.jobSettingKey, item.extensionCode,
                item.extensionSettingDisplayName, item.extensionSettingKey, item.extensionSettingCategoryCode]
                .some(value => (value || '').toLocaleLowerCase('tr').includes(filter)),
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    // ────────────────────────────── Silme ──────────────────────────────

    async remove(item: ExtensionLinkRow): Promise<void> {
        if (!confirm(`"${item.jobSettingName}" ↔ "${item.extensionCode} · ${item.extensionSettingDisplayName || item.extensionSettingKey}" bağlantısı kaldırılsın mı?`)) return;

        this.deletingId = item.id;
        try {
            await this.backgroundJobsService.removeExtensionSetting(item.jobCode, item.jobSettingKey, item.id);
            this.items = this.items.filter(row => row.id !== item.id);
            this.applyFilterAndPaging();
        } catch (err) {
            alert(this.errorText(err, 'Bağlantı kaldırılamadı.'));
        } finally {
            this.deletingId = null;
        }
    }

    // ────────────────────────────── Yeni bağlantı modalı ──────────────────────────────

    get jobSettings(): BackgroundJobSetting[] {
        const job = this.jobs.find(item => item.code === this.form.jobCode);
        return [...(job?.settings || [])]
            .filter(setting => !!setting.key)
            .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
    }

    get linkableExtensionSettings(): ExtensionSettingDefinition[] {
        const linked = new Set(
            this.items
                .filter(item => item.jobCode === this.form.jobCode && item.jobSettingKey === this.form.settingKey)
                .map(item => item.extensionSettingDefinitionId),
        );
        return (this.extensionSettingDefs[this.form.extensionId] || []).filter(def => !linked.has(def.id));
    }

    async openCreate(): Promise<void> {
        this.form = { jobCode: '', settingKey: '', extensionId: '', extensionSettingDefinitionId: '' };
        this.showModal = true;
        if (this.extensions.length) return;
        try {
            const response = await this.extensionService.getExtensionDefinitions();
            this.extensions = this.extractArray<ExtensionDefinition>(response)
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
        } catch (err) {
            alert(this.errorText(err, 'Extension listesi yüklenemedi.'));
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    onJobChange(): void {
        this.form.settingKey = '';
        this.form.extensionSettingDefinitionId = '';
    }

    async onExtensionChange(): Promise<void> {
        this.form.extensionSettingDefinitionId = '';
        const extensionId = this.form.extensionId;
        if (!extensionId || this.extensionSettingDefs[extensionId]) return;
        try {
            const response = await this.extensionService.getExtensionSettingDefinitions(extensionId);
            this.extensionSettingDefs[extensionId] = this.extractArray<ExtensionSettingDefinition>(response)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
        } catch (err) {
            alert(this.errorText(err, 'Extension ayarları yüklenemedi.'));
        }
    }

    async save(): Promise<void> {
        const { jobCode, settingKey, extensionSettingDefinitionId } = this.form;
        if (!jobCode || !settingKey || !extensionSettingDefinitionId) {
            alert('Servis, iş ayarı ve extension ayarı seçilmelidir.');
            return;
        }

        const job = this.jobs.find(item => item.code === jobCode);
        const setting = job?.settings?.find(item => item.key === settingKey);
        if (!job || !setting) return;

        this.saving = true;
        try {
            await this.backgroundJobsService.addExtensionSetting(jobCode, settingKey, { extensionSettingDefinitionId });
            // Bu ayarın bağlantılarını yeniden çekip listede yerinde değiştir
            const fresh = await this.fetchLinks(job, setting);
            this.items = [
                ...this.items.filter(item => !(item.jobCode === jobCode && item.jobSettingKey === settingKey)),
                ...fresh,
            ];
            this.applyFilterAndPaging();
            this.closeModal();
        } catch (err) {
            alert(this.errorText(err, 'Bağlantı eklenemedi.'));
        } finally {
            this.saving = false;
        }
    }

    // ────────────────────────────── Yardımcılar ──────────────────────────────

    private async fetchLinks(job: BackgroundJob, setting: BackgroundJobSetting): Promise<ExtensionLinkRow[]> {
        try {
            const response = await this.backgroundJobsService.getExtensionSettings(job.code!, setting.key!);
            return this.extractArray<BackgroundJobExtensionSetting>(response).map(link => ({
                ...link,
                jobName: job.name || job.code || '',
                jobSettingName: setting.displayName || setting.key || '',
            }));
        } catch {
            return [];
        }
    }

    private errorText(err: unknown, fallback: string): string {
        const body = (err as { error?: { errorCode?: string; innerError?: string; message?: string } })?.error;
        return body?.innerError || body?.errorCode || body?.message || fallback;
    }

    private extractArray<T>(response: any): T[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BackgroundJobsService } from '@/app/core/services/background-jobs.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';
import { ExtensionSettingDefinition } from '@/app/core/models/extension/extension-setting-definition.models';
import {
    BackgroundJob,
    BackgroundJobExtensionSetting,
    BackgroundJobSetting,
    CreateBackgroundJobSettingDefinitionRequest,
    UpdateBackgroundJobRequest,
    UpdateBackgroundJobSettingDefinitionRequest,
} from '@/app/core/models/background-jobs/background-jobs.models';

type RunState = 'running' | 'failed' | 'success' | 'never';

interface RunStateView {
    label: string;
    css: string;
    icon: string;
}

const RUN_STATES: Record<RunState, RunStateView> = {
    running: { label: 'Çalışıyor', css: 'bg-info-subtle text-info', icon: 'fa-solid fa-spinner fa-spin' },
    failed: { label: 'Hata', css: 'bg-danger-subtle text-danger', icon: 'fa-solid fa-triangle-exclamation' },
    success: { label: 'Başarılı', css: 'bg-success-subtle text-success', icon: 'fa-solid fa-check' },
    never: { label: 'Çalışmadı', css: 'bg-secondary-subtle text-secondary', icon: 'fa-regular fa-clock' },
};
  
/**
 * Arka Plan Servisleri — sunucuda periyodik çalışan işlerin (senkronizasyon,
 * temizlik vb.) izlenmesi ve yönetimi. İşler sabittir (oluşturma/silme yok);
 * açma/kapama, zamanlama, ayar değerleri ve anında çalıştırma yapılır.
 */
@Component({
    selector: 'app-background-jobs',
    imports: [FormsModule, DatePipe],
    templateUrl: './background-jobs.html',
    styleUrls: ['./background-jobs.scss'],
})
export class BackgroundJobsPage implements OnInit {
    items: BackgroundJob[] = [];
    loading = false;

    // ── Liste filtre + sayfalama ──
    filterText = '';
    filteredItems: BackgroundJob[] = [];
    pagedItems: BackgroundJob[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // ── Satır işlemleri ──
    togglingId: string | null = null;
    runningCode: string | null = null;
    expandedErrorId: string | null = null;

    // ── Zamanlama modalı ──
    showModal = false;
    saving = false;
    editingJob: BackgroundJob | null = null;
    form: { intervalSeconds: number; maxParallelism: number | null; lockTimeoutSeconds: number } = {
        intervalSeconds: 60,
        maxParallelism: null,
        lockTimeoutSeconds: 300,
    };

    // ── Ayarlar modalı ──
    showSettingsModal = false;
    settingsJob: BackgroundJob | null = null;
    settings: BackgroundJobSetting[] = [];
    loadingSettings = false;
    settingValues: Record<string, string> = {};
    savingSettingKey: string | null = null;

    // ── Ayar tanımı ekleme / düzenleme (ayarlar modalı içinde) ──
    definitionKey: string | null = null;
    definitionForm: UpdateBackgroundJobSettingDefinitionRequest = {};
    showCreateDefinition = false;
    savingDefinition = false;
    createForm: CreateBackgroundJobSettingDefinitionRequest = this.emptyCreateForm();
    /** v1.yaml'de sabit bir liste yok — öneri olarak sunulur, serbest giriş de yapılabilir */
    readonly dataTypeOptions = ['string', 'int', 'long', 'decimal', 'bool', 'datetime', 'json'];

    // ── Extension bağlantıları (ayar satırı içinde) ──
    linkKey: string | null = null;
    links: BackgroundJobExtensionSetting[] = [];
    loadingLinks = false;
    linking = false;
    extensions: ExtensionDefinition[] = [];
    extensionSettingDefs: Record<string, ExtensionSettingDefinition[]> = {};
    linkExtensionId = '';
    linkSettingDefId = '';

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
            this.items = this.extractArray(response);
        } catch (err) {
            console.error('BackgroundJobs load error:', err);
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
            (item.name || '').toLocaleLowerCase('tr').includes(filter) ||
            (item.code || '').toLocaleLowerCase('tr').includes(filter) ||
            (item.description || '').toLocaleLowerCase('tr').includes(filter),
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    // ────────────────────────────── Görünüm yardımcıları ──────────────────────────────

    get enabledCount(): number {
        return this.items.filter(item => item.isEnabled).length;
    }

    get failedCount(): number {
        return this.items.filter(item => this.runState(item) === 'failed').length;
    }

    get runningCount(): number {
        return this.items.filter(item => this.runState(item) === 'running').length;
    }

    /**
     * `lastRunStatus` için v1.yaml'de enum tanımı olmadığından durum,
     * kilit ve hata alanlarından türetilir.
     */
    runState(item: BackgroundJob): RunState {
        if (item.lockedUntil && new Date(item.lockedUntil).getTime() > Date.now()) return 'running';
        if (item.lastErrorMessage) return 'failed';
        if (item.lastRunEndDate || item.lastRunStartDate) return 'success';
        return 'never';
    }

    runStateView(item: BackgroundJob): RunStateView {
        return RUN_STATES[this.runState(item)];
    }

    formatSeconds(seconds: number | null | undefined): string {
        const total = Number(seconds) || 0;
        if (total <= 0) return '-';
        const units: [number, string][] = [[86400, 'gün'], [3600, 'sa'], [60, 'dk'], [1, 'sn']];
        const parts: string[] = [];
        let rest = total;
        for (const [size, label] of units) {
            const count = Math.floor(rest / size);
            if (count > 0) {
                parts.push(`${count} ${label}`);
                rest -= count * size;
            }
            if (parts.length === 2) break;
        }
        return parts.join(' ');
    }

    formatDuration(ms: number | null | undefined): string {
        if (ms === null || ms === undefined) return '-';
        const value = Number(ms);
        if (value < 1000) return `${value} ms`;
        if (value < 60000) return `${(value / 1000).toFixed(1)} sn`;
        return this.formatSeconds(Math.round(value / 1000));
    }

    isOverdue(item: BackgroundJob): boolean {
        return item.isEnabled && !!item.nextRunDate && new Date(item.nextRunDate).getTime() < Date.now() - 60000;
    }

    toggleError(item: BackgroundJob): void {
        this.expandedErrorId = this.expandedErrorId === item.id ? null : item.id;
    }

    settingCount(item: BackgroundJob): number {
        return item.settings?.length || 0;
    }

    // ────────────────────────────── Satır işlemleri ──────────────────────────────

    async toggleActive(item: BackgroundJob): Promise<void> {
        if (this.togglingId || !item.code) return;
        this.togglingId = item.id;
        const isEnabled = !item.isEnabled;
        try {
            await this.backgroundJobsService.updateJob(item.code, { isEnabled });
            item.isEnabled = isEnabled;
            this.applyFilterAndPaging();
        } catch (err) {
            alert(this.errorText(err, 'Durum güncellenemedi.'));
        } finally {
            this.togglingId = null;
        }
    }

    async runNow(item: BackgroundJob): Promise<void> {
        if (!item.code || this.runningCode) return;
        if (!confirm(`"${item.name || item.code}" servisi şimdi çalıştırılsın mı?`)) return;
        this.runningCode = item.code;
        try {
            await this.backgroundJobsService.runNow(item.code);
            await this.refreshJob(item.code);
        } catch (err) {
            alert(this.errorText(err, 'Servis çalıştırılamadı.'));
        } finally {
            this.runningCode = null;
        }
    }

    // ────────────────────────────── Zamanlama modalı ──────────────────────────────

    openEdit(item: BackgroundJob): void {
        this.editingJob = item;
        this.form = {
            intervalSeconds: Number(item.intervalSeconds) || 60,
            maxParallelism: item.maxParallelism ?? null,
            lockTimeoutSeconds: Number(item.lockTimeoutSeconds) || 300,
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.editingJob = null;
    }

    async save(): Promise<void> {
        const code = this.editingJob?.code;
        if (!code) return;
        if (!this.form.intervalSeconds || this.form.intervalSeconds < 1) {
            alert('Çalışma aralığı en az 1 saniye olmalıdır.');
            return;
        }
        if (!this.form.lockTimeoutSeconds || this.form.lockTimeoutSeconds < 1) {
            alert('Kilit zaman aşımı en az 1 saniye olmalıdır.');
            return;
        }

        this.saving = true;
        try {
            const request: UpdateBackgroundJobRequest = {
                intervalSeconds: Number(this.form.intervalSeconds),
                maxParallelism: this.form.maxParallelism ? Number(this.form.maxParallelism) : null,
                lockTimeoutSeconds: Number(this.form.lockTimeoutSeconds),
            };
            await this.backgroundJobsService.updateJob(code, request);
            await this.refreshJob(code);
            this.closeModal();
        } catch (err) {
            alert(this.errorText(err, 'Kaydedilemedi.'));
        } finally {
            this.saving = false;
        }
    }

    // ────────────────────────────── Ayarlar modalı ──────────────────────────────

    openSettings(item: BackgroundJob): void {
        this.settingsJob = item;
        this.settings = this.sortSettings(item.settings || []);
        this.fillSettingValues();
        this.definitionKey = null;
        this.showCreateDefinition = false;
        this.showSettingsModal = true;
        if (item.code) this.loadSettings(item.code);
    }

    closeSettingsModal(): void {
        this.showSettingsModal = false;
        this.settingsJob = null;
        this.settings = [];
        this.settingValues = {};
        this.definitionKey = null;
        this.showCreateDefinition = false;
        this.linkKey = null;
        this.links = [];
    }

    inputKind(setting: BackgroundJobSetting): 'checkbox' | 'number' | 'textarea' | 'password' | 'text' {
        const type = `${setting.inputType || ''} ${setting.dataType || ''}`.toLowerCase();
        if (/checkbox|switch|bool/.test(type)) return 'checkbox';
        if (/textarea|json/.test(type)) return 'textarea';
        if (/password|secret/.test(type)) return 'password';
        if (/number|int|decimal|double|float|long/.test(type)) return 'number';
        return 'text';
    }

    isChecked(key: string): boolean {
        return ['true', '1', 'yes'].includes((this.settingValues[key] || '').toLowerCase());
    }

    setChecked(key: string, checked: boolean): void {
        this.settingValues[key] = checked ? 'true' : 'false';
    }

    async saveSetting(setting: BackgroundJobSetting): Promise<void> {
        const code = this.settingsJob?.code;
        if (!code || !setting.key) return;

        const value = (this.settingValues[setting.key] ?? '').trim();
        if (setting.isRequired && !value) {
            alert(`"${setting.displayName || setting.key}" alanı zorunludur.`);
            return;
        }
        const rangeError = this.rangeError(setting, value);
        if (rangeError) {
            alert(rangeError);
            return;
        }

        this.savingSettingKey = setting.key;
        try {
            await this.backgroundJobsService.upsertSetting(code, setting.key, { value });
            await this.loadSettings(code);
        } catch (err) {
            alert(this.errorText(err, 'Ayar kaydedilemedi.'));
        } finally {
            this.savingSettingKey = null;
        }
    }

    async resetSetting(setting: BackgroundJobSetting): Promise<void> {
        const code = this.settingsJob?.code;
        if (!code || !setting.key) return;
        if (!confirm(`"${setting.displayName || setting.key}" varsayılan değerine döndürülsün mü?`)) return;

        this.savingSettingKey = setting.key;
        try {
            await this.backgroundJobsService.deleteSetting(code, setting.key);
            await this.loadSettings(code);
        } catch (err) {
            alert(this.errorText(err, 'Ayar sıfırlanamadı.'));
        } finally {
            this.savingSettingKey = null;
        }
    }

    // ── Ayar tanımı: ekle / düzenle / sil ──

    openCreateDefinition(): void {
        this.definitionKey = null;
        this.createForm = this.emptyCreateForm();
        this.showCreateDefinition = true;
    }

    async createDefinition(): Promise<void> {
        const code = this.settingsJob?.code;
        if (!code) return;

        const key = (this.createForm.key || '').trim();
        const dataType = (this.createForm.dataType || '').trim();
        if (!key || !dataType) {
            alert('Anahtar ve veri tipi zorunludur.');
            return;
        }
        if (this.settings.some(setting => setting.key?.toLowerCase() === key.toLowerCase())) {
            alert(`"${key}" anahtarı bu serviste zaten tanımlı.`);
            return;
        }

        this.savingDefinition = true;
        try {
            await this.backgroundJobsService.createSettingDefinition(code, {
                ...this.createForm,
                key,
                dataType,
                sortOrder: Number(this.createForm.sortOrder) || 0,
            });
            await this.loadSettings(code);
            this.showCreateDefinition = false;
        } catch (err) {
            alert(this.errorText(err, 'Ayar tanımı eklenemedi.'));
        } finally {
            this.savingDefinition = false;
        }
    }

    openDefinition(setting: BackgroundJobSetting): void {
        if (!setting.key) return;
        this.showCreateDefinition = false;
        this.definitionKey = this.definitionKey === setting.key ? null : setting.key;
        this.definitionForm = {
            displayName: setting.displayName,
            description: setting.description,
            defaultValue: setting.defaultValue,
            minValue: setting.minValue,
            maxValue: setting.maxValue,
            isRequired: setting.isRequired,
            sortOrder: Number(setting.sortOrder) || 0,
            isActive: setting.isActive,
        };
    }

    async saveDefinition(): Promise<void> {
        const code = this.settingsJob?.code;
        const key = this.definitionKey;
        if (!code || !key) return;

        this.savingSettingKey = key;
        try {
            await this.backgroundJobsService.updateSettingDefinition(code, key, {
                ...this.definitionForm,
                sortOrder: Number(this.definitionForm.sortOrder) || 0,
            });
            await this.loadSettings(code);
            this.definitionKey = null;
        } catch (err) {
            alert(this.errorText(err, 'Ayar tanımı kaydedilemedi.'));
        } finally {
            this.savingSettingKey = null;
        }
    }

    async deleteDefinition(setting: BackgroundJobSetting): Promise<void> {
        const code = this.settingsJob?.code;
        if (!code || !setting.key) return;
        if (!confirm(`"${setting.displayName || setting.key}" ayar tanımı ve girilmiş değeri silinsin mi? Bu işlem geri alınamaz.`)) return;

        this.savingSettingKey = setting.key;
        try {
            await this.backgroundJobsService.deleteSettingDefinition(code, setting.key);
            if (this.definitionKey === setting.key) this.definitionKey = null;
            await this.loadSettings(code);
        } catch (err) {
            alert(this.errorText(err, 'Ayar tanımı silinemedi.'));
        } finally {
            this.savingSettingKey = null;
        }
    }

    // ── Ayar tanımı ↔ extension ayarı bağlantıları ──

    get linkableExtensionSettings(): ExtensionSettingDefinition[] {
        const linked = new Set(this.links.map(link => link.extensionSettingDefinitionId));
        return (this.extensionSettingDefs[this.linkExtensionId] || []).filter(def => !linked.has(def.id));
    }

    async openLinks(setting: BackgroundJobSetting): Promise<void> {
        const code = this.settingsJob?.code;
        if (!code || !setting.key) return;
        if (this.linkKey === setting.key) {
            this.linkKey = null;
            return;
        }

        this.linkKey = setting.key;
        this.links = [];
        this.linkExtensionId = '';
        this.linkSettingDefId = '';
        await Promise.all([this.loadLinks(code, setting.key), this.loadExtensions()]);
    }

    async onLinkExtensionChange(): Promise<void> {
        this.linkSettingDefId = '';
        const extensionId = this.linkExtensionId;
        if (!extensionId || this.extensionSettingDefs[extensionId]) return;
        try {
            const response = await this.extensionService.getExtensionSettingDefinitions(extensionId);
            this.extensionSettingDefs[extensionId] = this.extractArray<ExtensionSettingDefinition>(response)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
        } catch (err) {
            alert(this.errorText(err, 'Extension ayarları yüklenemedi.'));
        }
    }

    async addLink(): Promise<void> {
        const code = this.settingsJob?.code;
        const key = this.linkKey;
        if (!code || !key || !this.linkSettingDefId) return;

        this.linking = true;
        try {
            await this.backgroundJobsService.addExtensionSetting(code, key, { extensionSettingDefinitionId: this.linkSettingDefId });
            this.linkSettingDefId = '';
            await this.loadLinks(code, key);
        } catch (err) {
            alert(this.errorText(err, 'Bağlantı eklenemedi.'));
        } finally {
            this.linking = false;
        }
    }

    async removeLink(link: BackgroundJobExtensionSetting): Promise<void> {
        const code = this.settingsJob?.code;
        const key = this.linkKey;
        if (!code || !key) return;
        if (!confirm(`"${link.extensionCode} · ${link.extensionSettingDisplayName || link.extensionSettingKey}" bağlantısı kaldırılsın mı?`)) return;

        this.linking = true;
        try {
            await this.backgroundJobsService.removeExtensionSetting(code, key, link.id);
            this.links = this.links.filter(item => item.id !== link.id);
        } catch (err) {
            alert(this.errorText(err, 'Bağlantı kaldırılamadı.'));
        } finally {
            this.linking = false;
        }
    }

    private async loadLinks(code: string, key: string): Promise<void> {
        this.loadingLinks = true;
        try {
            const response = await this.backgroundJobsService.getExtensionSettings(code, key);
            if (this.linkKey === key) this.links = this.extractArray<BackgroundJobExtensionSetting>(response);
        } catch (err) {
            console.error('BackgroundJob extension settings load error:', err);
        } finally {
            this.loadingLinks = false;
        }
    }

    /** Extension listesi bir kez çekilir, modal kapansa da önbellekte kalır */
    private async loadExtensions(): Promise<void> {
        if (this.extensions.length) return;
        try {
            const response = await this.extensionService.getExtensionDefinitions();
            this.extensions = this.extractArray<ExtensionDefinition>(response)
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
        } catch (err) {
            console.error('Extension definitions load error:', err);
        }
    }

    // ────────────────────────────── Yardımcılar ──────────────────────────────

    /** Tek işi yeniden çekip listede yerinde günceller */
    private async refreshJob(code: string): Promise<void> {
        const response = await this.backgroundJobsService.getJob(code);
        const fresh = response.data;
        if (!fresh) return;

        const index = this.items.findIndex(item => item.code === code);
        if (index >= 0) this.items[index] = fresh;
        this.applyFilterAndPaging();
    }

    /**
     * Ayar tanımlarını `setting-definitions` ucundan yeniden çeker; açık modalı
     * ve listedeki işin ayar sayısını yerinde günceller.
     */
    private async loadSettings(code: string): Promise<void> {
        this.loadingSettings = true;
        try {
            const response = await this.backgroundJobsService.getSettingDefinitions(code);
            const list = this.sortSettings(this.extractArray<BackgroundJobSetting>(response));

            const job = this.items.find(item => item.code === code);
            if (job) job.settings = list;
            if (this.settingsJob?.code === code) {
                this.settings = list;
                this.fillSettingValues();
            }
        } catch (err) {
            console.error('BackgroundJob settings load error:', err);
        } finally {
            this.loadingSettings = false;
        }
    }

    private sortSettings(list: BackgroundJobSetting[]): BackgroundJobSetting[] {
        return [...list].sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
    }

    private fillSettingValues(): void {
        this.settingValues = {};
        for (const setting of this.settings) {
            if (!setting.key) continue;
            this.settingValues[setting.key] = setting.value ?? setting.effectiveValue ?? setting.defaultValue ?? '';
        }
    }

    private emptyCreateForm(): CreateBackgroundJobSettingDefinitionRequest {
        const lastOrder = this.settings.reduce((max, setting) => Math.max(max, Number(setting.sortOrder) || 0), 0);
        return {
            key: '',
            dataType: 'string',
            displayName: '',
            description: '',
            defaultValue: '',
            minValue: '',
            maxValue: '',
            isRequired: false,
            sortOrder: lastOrder + 10,
            isActive: true,
        };
    }

    private rangeError(setting: BackgroundJobSetting, value: string): string | null {
        if (this.inputKind(setting) !== 'number' || !value) return null;
        const numeric = Number(value);
        const label = setting.displayName || setting.key;
        if (Number.isNaN(numeric)) return `"${label}" sayısal olmalıdır.`;
        if (setting.minValue && numeric < Number(setting.minValue)) return `"${label}" en az ${setting.minValue} olmalıdır.`;
        if (setting.maxValue && numeric > Number(setting.maxValue)) return `"${label}" en fazla ${setting.maxValue} olabilir.`;
        return null;
    }

    private errorText(err: unknown, fallback: string): string {
        const body = (err as { error?: { errorCode?: string; innerError?: string; message?: string } })?.error;
        return body?.innerError || body?.errorCode || body?.message || fallback;
    }

    private extractArray<T = BackgroundJob>(response: any): T[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

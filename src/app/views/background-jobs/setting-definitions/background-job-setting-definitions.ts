import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackgroundJobsService } from '@/app/core/services/background-jobs.service';
import {
    BackgroundJob,
    BackgroundJobSetting,
    CreateBackgroundJobSettingDefinitionRequest,
    UpdateBackgroundJobSettingDefinitionRequest,
} from '@/app/core/models/background-jobs/background-jobs.models';

/** Tanım satırı + ait olduğu servisin bilgisi */
interface SettingDefinitionRow extends BackgroundJobSetting {
    jobCode: string;
    jobName: string;
}

interface DefinitionForm {
    jobCode: string;
    key: string;
    dataType: string;
    displayName: string;
    description: string;
    defaultValue: string;
    minValue: string;
    maxValue: string;
    isRequired: boolean;
    sortOrder: number;
    isActive: boolean;
}

/**
 * Arka Plan Ayar Tanımları — tüm servislerin ayar tanımları (BackgroundJobSettingDefinitions)
 * için CRUD. Tanımlar servis `code` + ayar `key` ile adreslenir; API'de toplu
 * liste ucu olmadığından her servis için `setting-definitions` ayrı çekilir.
 */
@Component({
    selector: 'app-background-job-setting-definitions',
    imports: [FormsModule],
    templateUrl: './background-job-setting-definitions.html',
    styleUrls: ['./background-job-setting-definitions.scss'],
})
export class BackgroundJobSettingDefinitionsPage implements OnInit {
    items: SettingDefinitionRow[] = [];
    jobs: BackgroundJob[] = [];
    loading = false;

    // ── Liste filtre + sayfalama ──
    filterText = '';
    jobFilter = '';
    filteredItems: SettingDefinitionRow[] = [];
    pagedItems: SettingDefinitionRow[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // ── Satır işlemleri ──
    togglingId: string | null = null;
    deletingId: string | null = null;

    // ── Ekle / düzenle modalı ──
    showModal = false;
    saving = false;
    editing: SettingDefinitionRow | null = null;
    form: DefinitionForm = this.emptyForm();
    /** v1.yaml'de sabit bir liste yok — öneri olarak sunulur, serbest giriş de yapılabilir */
    readonly dataTypeOptions = ['string', 'int', 'long', 'decimal', 'bool', 'datetime', 'json'];

    constructor(private backgroundJobsService: BackgroundJobsService) {}

    ngOnInit(): void {
        this.loadItems();
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.backgroundJobsService.getJobs();
            this.jobs = this.extractArray<BackgroundJob>(response)
                .filter(job => !!job.code)
                .sort((a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || '', 'tr'));

            const lists = await Promise.all(this.jobs.map(job => this.fetchDefinitions(job)));
            this.items = lists.flat();
        } catch (err) {
            console.error('BackgroundJob setting definitions load error:', err);
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
            (!this.jobFilter || item.jobCode === this.jobFilter) &&
            (!filter ||
                [item.jobName, item.jobCode, item.key, item.displayName, item.description, item.dataType]
                    .some(value => (value || '').toLocaleLowerCase('tr').includes(filter))),
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    // ────────────────────────────── Satır işlemleri ──────────────────────────────

    async toggleActive(item: SettingDefinitionRow): Promise<void> {
        if (this.togglingId || !item.key) return;
        this.togglingId = item.definitionId;
        const isActive = !item.isActive;
        try {
            await this.backgroundJobsService.updateSettingDefinition(item.jobCode, item.key, { isActive });
            item.isActive = isActive;
            this.applyFilterAndPaging();
        } catch (err) {
            alert(this.errorText(err, 'Durum güncellenemedi.'));
        } finally {
            this.togglingId = null;
        }
    }

    async remove(item: SettingDefinitionRow): Promise<void> {
        if (!item.key) return;
        if (!confirm(`"${item.jobName}" servisindeki "${item.displayName || item.key}" tanımı ve girilmiş değeri silinsin mi? Bu işlem geri alınamaz.`)) return;

        this.deletingId = item.definitionId;
        try {
            await this.backgroundJobsService.deleteSettingDefinition(item.jobCode, item.key);
            this.items = this.items.filter(row => row.definitionId !== item.definitionId);
            this.applyFilterAndPaging();
        } catch (err) {
            alert(this.errorText(err, 'Tanım silinemedi.'));
        } finally {
            this.deletingId = null;
        }
    }

    // ────────────────────────────── Ekle / düzenle modalı ──────────────────────────────

    openCreate(): void {
        this.editing = null;
        this.form = this.emptyForm();
        this.form.jobCode = this.jobFilter;
        this.form.sortOrder = this.nextSortOrder(this.jobFilter);
        this.showModal = true;
    }

    openEdit(item: SettingDefinitionRow): void {
        this.editing = item;
        this.form = {
            jobCode: item.jobCode,
            key: item.key || '',
            dataType: item.dataType || '',
            displayName: item.displayName || '',
            description: item.description || '',
            defaultValue: item.defaultValue || '',
            minValue: item.minValue || '',
            maxValue: item.maxValue || '',
            isRequired: item.isRequired,
            sortOrder: Number(item.sortOrder) || 0,
            isActive: item.isActive,
        };
        this.showModal = true;
    }

    onFormJobChange(): void {
        if (!this.editing) this.form.sortOrder = this.nextSortOrder(this.form.jobCode);
    }

    closeModal(): void {
        this.showModal = false;
        this.editing = null;
    }

    async save(): Promise<void> {
        const jobCode = this.form.jobCode;
        const key = this.form.key.trim();
        const dataType = this.form.dataType.trim();
        if (!jobCode) {
            alert('Servis seçilmelidir.');
            return;
        }
        if (!this.editing && (!key || !dataType)) {
            alert('Anahtar ve veri tipi zorunludur.');
            return;
        }
        if (!this.editing && this.items.some(item => item.jobCode === jobCode && item.key?.toLowerCase() === key.toLowerCase())) {
            alert(`"${key}" anahtarı bu serviste zaten tanımlı.`);
            return;
        }

        const common = {
            displayName: this.form.displayName.trim() || null,
            description: this.form.description.trim() || null,
            defaultValue: this.form.defaultValue.trim() || null,
            minValue: this.form.minValue.trim() || null,
            maxValue: this.form.maxValue.trim() || null,
            isRequired: this.form.isRequired,
            sortOrder: Number(this.form.sortOrder) || 0,
            isActive: this.form.isActive,
        };

        this.saving = true;
        try {
            if (this.editing?.key) {
                const request: UpdateBackgroundJobSettingDefinitionRequest = common;
                await this.backgroundJobsService.updateSettingDefinition(jobCode, this.editing.key, request);
            } else {
                const request: CreateBackgroundJobSettingDefinitionRequest = { ...common, key, dataType };
                await this.backgroundJobsService.createSettingDefinition(jobCode, request);
            }
            await this.reloadJob(jobCode);
            this.closeModal();
        } catch (err) {
            alert(this.errorText(err, 'Tanım kaydedilemedi.'));
        } finally {
            this.saving = false;
        }
    }

    // ────────────────────────────── Yardımcılar ──────────────────────────────

    /** Tek servisin tanımlarını yeniden çekip listede yerinde değiştirir */
    private async reloadJob(jobCode: string): Promise<void> {
        const job = this.jobs.find(item => item.code === jobCode);
        if (!job) return;
        const fresh = await this.fetchDefinitions(job);
        this.items = [...this.items.filter(item => item.jobCode !== jobCode), ...fresh];
        this.sortItems();
        this.applyFilterAndPaging();
    }

    private async fetchDefinitions(job: BackgroundJob): Promise<SettingDefinitionRow[]> {
        try {
            const response = await this.backgroundJobsService.getSettingDefinitions(job.code!);
            return this.extractArray<BackgroundJobSetting>(response)
                .map(setting => ({ ...setting, jobCode: job.code!, jobName: job.name || job.code! }))
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
        } catch {
            return [];
        }
    }

    /** Servis sırasını (ada göre) koruyarak, servis içinde sortOrder'a göre sıralar */
    private sortItems(): void {
        const jobOrder = new Map(this.jobs.map((job, index) => [job.code, index]));
        this.items.sort((a, b) =>
            (jobOrder.get(a.jobCode) ?? 0) - (jobOrder.get(b.jobCode) ?? 0) ||
            Number(a.sortOrder) - Number(b.sortOrder),
        );
    }

    private nextSortOrder(jobCode: string): number {
        if (!jobCode) return 10;
        const last = this.items
            .filter(item => item.jobCode === jobCode)
            .reduce((max, item) => Math.max(max, Number(item.sortOrder) || 0), 0);
        return last + 10;
    }

    private emptyForm(): DefinitionForm {
        return {
            jobCode: '',
            key: '',
            dataType: 'string',
            displayName: '',
            description: '',
            defaultValue: '',
            minValue: '',
            maxValue: '',
            isRequired: false,
            sortOrder: 10,
            isActive: true,
        };
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

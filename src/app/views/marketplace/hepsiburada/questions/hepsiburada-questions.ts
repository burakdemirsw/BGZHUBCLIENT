import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HepsiburadaMarketplaceService } from '@/app/core/services/hepsiburada-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { DynamicTable } from '../../shared/dynamic-table/dynamic-table';
import { ToolRow, parseToolResult } from '../../shared/tool-result.util';
import { MarketplaceToolResult } from '@/app/core/models/marketplace/marketplace.models';

/** Bekleyen soru sayısının aranacağı alan adları */
const COUNT_KEYS = ['count', 'totalCount', 'total', 'waitingCount', 'pendingCount', 'openCount', 'value', 'result'];

/**
 * Hepsiburada sorularının tipli karşılığı yoktur; veri `dataJson` içinde serbest JSON olarak gelir.
 * Satırlarda `issueNumber` varsa özel tablo, yoksa jenerik tablo gösterilir.
 */
@Component({
    selector: 'app-hepsiburada-questions',
    imports: [CommonModule, FormsModule, TablePager, DynamicTable],
    templateUrl: './hepsiburada-questions.html',
    styleUrls: ['./hepsiburada-questions.scss'],
})
export class HepsiburadaQuestionsPage extends MarketplacePagedTab<ToolRow> {
    private marketplace = inject(HepsiburadaMarketplaceService);

    readonly minAnswerLength = 10;
    readonly maxAnswerLength = 2000;

    statusFilter = '';
    subjectFilter = '';
    searchFilter = '';
    startDate = '';
    endDate = '';

    /** Bekleyen soru sayısı (çözümlenemezse gösterilmez) */
    pendingCount: number | null = null;

    showModal = false;
    /** Modalda cevaplanan / detayı açılan satır */
    selectedRow: ToolRow | null = null;
    detailOnly = false;
    answerText = '';
    answering = false;
    answerError = '';

    override ngOnInit(): void {
        super.ngOnInit();
        this.loadPendingCount();
    }

    protected async fetchPage(page: number, size: number): Promise<PageResult<ToolRow>> {
        const response = await this.marketplace.getQuestions({
            status: this.statusFilter.trim() || null,
            subject: this.subjectFilter.trim() || null,
            search: this.searchFilter.trim() || null,
            minCreatedAt: this.toIsoDate(this.startDate),
            maxCreatedAt: this.toIsoDate(this.endDate, true),
            desc: true,
            page,
            size,
        });
        const result = this.unwrap(response);
        const { rows, rowCount, error } = parseToolResult(result);
        if (error) this.errorMessage = error;

        const total = rowCount || rows.length;
        return {
            items: rows,
            // Toplam kayıt sayısı gelmiyorsa sayfa sayısı bilinemez
            totalCount: total > rows.length ? total : null,
            hasNext: rows.length === size,
        };
    }

    protected searchText(row: ToolRow): string {
        return Object.values(row)
            .filter(value => typeof value === 'string' || typeof value === 'number')
            .join(' ');
    }

    // ── Satır okuma yardımcıları ────────────────

    /** Verilen alanlardan ilk dolu olanı metin olarak döner */
    text(row: ToolRow, ...keys: string[]): string {
        for (const key of keys) {
            const value = row[key];
            if (value === null || value === undefined) continue;
            if (typeof value === 'string') {
                if (value.trim()) return value;
                continue;
            }
            if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        }
        return '';
    }

    /** Tarih alanını Date'e çevirir (geçersizse null) */
    dateOf(row: ToolRow, ...keys: string[]): Date | null {
        const raw = this.text(row, ...keys);
        if (!raw) return null;
        const date = new Date(raw);
        return Number.isFinite(date.getTime()) ? date : null;
    }

    issueNumberOf(row: ToolRow): number | null {
        return this.toNumber(row['issueNumber']);
    }

    /** Satırlar issueNumber taşıyorsa özel tablo çizilir */
    get hasIssueNumber(): boolean {
        return this.pagedItems.some(row => this.issueNumberOf(row) !== null);
    }

    statusClass(status: string): string {
        const value = status.toLocaleLowerCase('en');
        if (value.includes('answer') && !value.includes('wait')) return 'bg-success-subtle text-success';
        if (value.includes('wait') || value.includes('pending') || value.includes('open')) return 'bg-warning-subtle text-warning';
        if (value.includes('close') || value.includes('reject')) return 'bg-danger-subtle text-danger';
        return 'bg-primary-subtle text-primary';
    }

    // ── Filtreler ────────────────

    clearFilters(): void {
        this.statusFilter = '';
        this.subjectFilter = '';
        this.searchFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.filterText = '';
        this.onServerFilterChange();
    }

    // ── Cevaplama ────────────────

    get answerValid(): boolean {
        const length = this.answerText.trim().length;
        return length >= this.minAnswerLength && length <= this.maxAnswerLength;
    }

    get selectedJson(): string {
        return this.selectedRow ? JSON.stringify(this.selectedRow, null, 2) : '';
    }

    openAnswer(row: ToolRow): void {
        this.selectedRow = row;
        this.detailOnly = false;
        this.answerText = '';
        this.answerError = '';
        this.showModal = true;
    }

    openDetail(row: ToolRow): void {
        this.selectedRow = row;
        this.detailOnly = true;
        this.answerError = '';
        this.showModal = true;
    }

    closeModal(): void {
        if (this.answering) return;
        this.showModal = false;
        this.selectedRow = null;
    }

    async submitAnswer(): Promise<void> {
        const row = this.selectedRow;
        const issueNumber = row ? this.issueNumberOf(row) : null;
        if (issueNumber === null || !this.answerValid) return;

        this.answering = true;
        this.answerError = '';
        try {
            const response = await this.marketplace.answerQuestion({
                issueNumber,
                answer: this.answerText.trim(),
            });
            if (!response.isSuccess) {
                this.answerError = response.innerError || response.errorCode || 'Cevap gönderilemedi.';
                return;
            }
            if (response.data?.success === false) {
                this.answerError = response.data.errorMessage || 'Cevap gönderilemedi.';
                return;
            }
            this.answering = false;
            this.closeModal();
            await this.load();
            this.loadPendingCount();
        } catch (err) {
            console.error('Soru cevaplanamadı:', err);
            this.answerError = this.errorText(err, 'Cevap gönderilemedi.');
        } finally {
            this.answering = false;
        }
    }

    // ── Bekleyen soru sayısı ────────────────

    private async loadPendingCount(): Promise<void> {
        try {
            const response = await this.marketplace.getQuestionCount();
            this.pendingCount = response.isSuccess ? this.extractCount(response.data) : null;
        } catch (err) {
            console.error('Bekleyen soru sayısı alınamadı:', err);
            this.pendingCount = null;
        }
    }

    private extractCount(result: MarketplaceToolResult | null): number | null {
        if (!result || result.success === false) return null;
        if (result.dataJson) {
            let parsed: unknown;
            try {
                parsed = JSON.parse(result.dataJson);
            } catch {
                parsed = null;
            }
            const direct = this.toNumber(parsed);
            if (direct !== null) return direct;
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                const obj = parsed as ToolRow;
                for (const key of COUNT_KEYS) {
                    const value = this.toNumber(obj[key]);
                    if (value !== null) return value;
                }
            }
        }
        return this.toNumber(result.rowCount);
    }

    private toNumber(value: unknown): number | null {
        if (typeof value === 'number') return Number.isFinite(value) ? value : null;
        if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    }
}

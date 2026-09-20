import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BeymenMarketplaceService } from '@/app/core/services/beymen-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { DynamicTable } from '../../shared/dynamic-table/dynamic-table';
import { ToolRow, parseToolResult } from '../../shared/tool-result.util';
import { BeymenQuestionId } from '@/app/core/models/marketplace/beymen.models';

/**
 * Beymen müşteri soruları `MarketplaceToolResult.dataJson` içinde şemasız JSON olarak gelir.
 * Satırlarda soru kimliği bulunursa sabit kolonlu tablo + cevaplama aksiyonları, aksi halde adaptif tablo çizilir.
 */
@Component({
    selector: 'app-beymen-questions',
    imports: [CommonModule, FormsModule, TablePager, DynamicTable],
    templateUrl: './beymen-questions.html',
    styleUrls: ['./beymen-questions.scss'],
})
export class BeymenQuestionsPage extends MarketplacePagedTab<ToolRow> {
    private marketplace = inject(BeymenMarketplaceService);

    readonly minAnswerLength = 10;
    readonly maxAnswerLength = 2000;

    productNameFilter = '';
    modelCodeFilter = '';
    brandNameFilter = '';
    colorFilter = '';
    statusFilter = '';
    startDate = '';
    endDate = '';

    showAnswerModal = false;
    showReportModal = false;
    showDetailModal = false;
    selectedRow: ToolRow | null = null;

    answerText = '';
    answering = false;
    answerError = '';

    reportReason = '';
    reporting = false;
    reportError = '';

    protected async fetchPage(page: number, size: number): Promise<PageResult<ToolRow>> {
        const result = this.unwrap(await this.marketplace.getQuestions({
            productName: this.productNameFilter.trim() || null,
            modelCode: this.modelCodeFilter.trim() || null,
            brandName: this.brandNameFilter.trim() || null,
            color: this.colorFilter.trim() || null,
            status: this.statusFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            page: page - 1,
            size,
        }));
        const { rows, rowCount, error } = parseToolResult(result);
        if (error) this.errorMessage = error;
        // rowCount çoğu zaman sadece bu sayfadaki kayıt sayısıdır; toplam bilinmiyorsa pager sayfa modunda çalışır
        const isTotal = rowCount > rows.length;
        return {
            items: rows,
            totalCount: isTotal ? rowCount : null,
            hasNext: rows.length === size,
        };
    }

    protected searchText(row: ToolRow): string {
        return Object.values(row)
            .filter((value): value is string | number | boolean =>
                value !== null && value !== undefined && typeof value !== 'object')
            .join(' ');
    }

    /** Satırlarda soru kimliği var mı? (sabit kolonlu tablo ve aksiyonlar çizilsin mi) */
    get hasQuestionShape(): boolean {
        return this.pagedItems.some(row => this.questionId(row) !== null);
    }

    /** Verilen alanlardan ilk dolu olanı metin olarak döndürür */
    text(row: ToolRow, ...keys: string[]): string {
        for (const key of keys) {
            const value = row[key];
            if (value === null || value === undefined || value === '' || typeof value === 'object') continue;
            if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
            return String(value);
        }
        return '-';
    }

    /** Verilen alanlardan ilk sayısal olanı döndürür */
    num(row: ToolRow, ...keys: string[]): number | null {
        for (const key of keys) {
            const value = row[key];
            if (typeof value === 'number' && Number.isFinite(value)) return value;
            if (typeof value === 'string' && value.trim() !== '') {
                const parsed = Number(value.replace(',', '.'));
                if (Number.isFinite(parsed)) return parsed;
            }
        }
        return null;
    }

    has(row: ToolRow, key: string): boolean {
        const value = row[key];
        return value !== null && value !== undefined && value !== '';
    }

    /** Tarih alanını okunur biçime çevirir; çözümlenemezse ham değeri gösterir */
    dateText(row: ToolRow, ...keys: string[]): string {
        for (const key of keys) {
            const value = row[key];
            if (value === null || value === undefined || value === '' || typeof value === 'object') continue;
            if (typeof value === 'number') return this.formatDate(new Date(value > 1e11 ? value : value * 1000));
            const raw = String(value);
            if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
                const parsed = new Date(raw);
                if (Number.isFinite(parsed.getTime())) return this.formatDate(parsed);
            }
            return raw;
        }
        return '-';
    }

    questionTextOf(row: ToolRow): string {
        return this.text(row, 'question', 'questionText', 'text', 'message', 'content');
    }

    answerTextOf(row: ToolRow): string {
        return this.text(row, 'answer', 'answerText', 'reply');
    }

    statusText(row: ToolRow): string {
        return this.text(row, 'status', 'statusName', 'questionStatus');
    }

    statusClass(status: string): string {
        const value = status.toLocaleLowerCase('tr');
        if (value.includes('cevapland') || value.includes('answered') || value.includes('yanıtland')) {
            return 'bg-success-subtle text-success';
        }
        if (value.includes('red') || value.includes('reject') || value.includes('report') || value.includes('şikayet')) {
            return 'bg-danger-subtle text-danger';
        }
        if (value.includes('bekl') || value.includes('wait') || value.includes('pending')) {
            return 'bg-warning-subtle text-warning';
        }
        return 'bg-primary-subtle text-primary';
    }

    /** Aksiyon butonları yalnızca soru kimliği çözümlenebilen satırlarda gösterilir */
    canAct(row: ToolRow): boolean {
        return this.questionId(row) !== null;
    }

    get answerValid(): boolean {
        const length = this.answerText.trim().length;
        return length >= this.minAnswerLength && length <= this.maxAnswerLength;
    }

    get reportValid(): boolean {
        return this.reportReason.trim().length > 0;
    }

    clearFilters(): void {
        this.productNameFilter = '';
        this.modelCodeFilter = '';
        this.brandNameFilter = '';
        this.colorFilter = '';
        this.statusFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.filterText = '';
        this.onServerFilterChange();
    }

    openAnswer(row: ToolRow): void {
        this.selectedRow = row;
        this.answerText = '';
        this.answerError = '';
        this.showAnswerModal = true;
    }

    openReport(row: ToolRow): void {
        this.selectedRow = row;
        this.reportReason = '';
        this.reportError = '';
        this.showReportModal = true;
    }

    openDetail(row: ToolRow): void {
        this.selectedRow = row;
        this.showDetailModal = true;
    }

    closeAnswerModal(): void {
        if (this.answering) return;
        this.showAnswerModal = false;
        this.selectedRow = null;
    }

    closeReportModal(): void {
        if (this.reporting) return;
        this.showReportModal = false;
        this.selectedRow = null;
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedRow = null;
    }

    async submitAnswer(): Promise<void> {
        const questionId = this.selectedRow ? this.questionId(this.selectedRow) : null;
        if (questionId === null || !this.answerValid) return;

        this.answering = true;
        this.answerError = '';
        try {
            const response = await this.marketplace.answerQuestion({ questionId, answer: this.answerText.trim() });
            if (!response.isSuccess) {
                this.answerError = response.innerError || response.errorCode || 'Cevap gönderilemedi.';
                return;
            }
            if (response.data?.success === false) {
                this.answerError = response.data.errorMessage || 'Cevap gönderilemedi.';
                return;
            }
            this.showAnswerModal = false;
            this.selectedRow = null;
            await this.load();
        } catch (err) {
            console.error('Soru cevaplanamadı:', err);
            this.answerError = this.errorText(err, 'Cevap gönderilemedi.');
        } finally {
            this.answering = false;
        }
    }

    async submitReport(): Promise<void> {
        const questionId = this.selectedRow ? this.questionId(this.selectedRow) : null;
        if (questionId === null || !this.reportValid) return;

        this.reporting = true;
        this.reportError = '';
        try {
            const response = await this.marketplace.reportQuestionIssue({
                questionId,
                reportReason: this.reportReason.trim(),
            });
            if (!response.isSuccess) {
                this.reportError = response.innerError || response.errorCode || 'Bildirim gönderilemedi.';
                return;
            }
            if (response.data?.success === false) {
                this.reportError = response.data.errorMessage || 'Bildirim gönderilemedi.';
                return;
            }
            this.showReportModal = false;
            this.selectedRow = null;
            await this.load();
        } catch (err) {
            console.error('Soru bildirimi gönderilemedi:', err);
            this.reportError = this.errorText(err, 'Bildirim gönderilemedi.');
        } finally {
            this.reporting = false;
        }
    }

    get selectedJson(): string {
        return this.selectedRow ? JSON.stringify(this.selectedRow, null, 2) : '';
    }

    /** Aksiyonlarda kullanılan soru kimliği; UI'de metin olarak gösterilmez */
    private questionId(row: ToolRow): BeymenQuestionId | null {
        const value = row['questionId'] ?? row['id'];
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '') return value;
        return null;
    }

    private formatDate(date: Date): string {
        if (!Number.isFinite(date.getTime())) return '-';
        return date.toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    }
}

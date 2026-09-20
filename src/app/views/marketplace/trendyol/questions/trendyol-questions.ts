import { Component, inject } from '@angular/core';
import { TrendyolMarketplaceService } from '@/app/core/services/trendyol-marketplace.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { TrendyolQuestion } from '@/app/core/models/marketplace/trendyol.models';

@Component({
    selector: 'app-trendyol-questions',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './trendyol-questions.html',
    styleUrls: ['./trendyol-questions.scss'],
})
export class TrendyolQuestionsPage extends MarketplacePagedTab<TrendyolQuestion> {
    private marketplace = inject(TrendyolMarketplaceService);

    /** Trendyol cevap uzunluğu sınırları */
    readonly minAnswerLength = 10;
    readonly maxAnswerLength = 2000;

    readonly statusOptions: { value: string; label: string }[] = [
        { value: 'WAITING_FOR_ANSWER', label: 'Cevap Bekliyor' },
        { value: 'WAITING_FOR_APPROVE', label: 'Onay Bekliyor' },
        { value: 'ANSWERED', label: 'Cevaplandı' },
        { value: 'REPORTED', label: 'Raporlandı' },
        { value: 'REJECTED', label: 'Reddedildi' },
    ];

    statusFilter = 'WAITING_FOR_ANSWER';
    barcodeFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedQuestion: TrendyolQuestion | null = null;
    answerText = '';
    answering = false;
    answerError = '';

    protected async fetchPage(page: number, size: number): Promise<PageResult<TrendyolQuestion>> {
        const data = this.unwrap(await this.marketplace.getQuestions({
            status: this.statusFilter || null,
            barcode: this.barcodeFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            orderByField: 'CreatedDate',
            orderByDirection: 'DESC',
            page: page - 1,
            size,
        }));
        return {
            items: this.extractArray(data?.content),
            totalCount: Number(data?.totalElements) || 0,
            totalPages: data?.totalPages ?? null,
        };
    }

    protected searchText(q: TrendyolQuestion): string {
        return [q.text, q.userName, q.productName, q.productMainId, q.answer?.text].filter(Boolean).join(' ');
    }

    statusLabel(status: string | null | undefined): string {
        return this.statusOptions.find(s => s.value === status)?.label || status || '-';
    }

    statusClass(status: string | null | undefined): string {
        switch (status) {
            case 'ANSWERED': return 'bg-success-subtle text-success';
            case 'WAITING_FOR_ANSWER': return 'bg-warning-subtle text-warning';
            case 'WAITING_FOR_APPROVE': return 'bg-info-subtle text-info';
            default: return 'bg-danger-subtle text-danger';
        }
    }

    canAnswer(q: TrendyolQuestion): boolean {
        return q.status === 'WAITING_FOR_ANSWER';
    }

    get answerValid(): boolean {
        const len = this.answerText.trim().length;
        return len >= this.minAnswerLength && len <= this.maxAnswerLength;
    }

    clearFilters(): void {
        this.statusFilter = '';
        this.barcodeFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onServerFilterChange();
    }

    openAnswer(q: TrendyolQuestion): void {
        this.selectedQuestion = q;
        this.answerText = '';
        this.answerError = '';
        this.showModal = true;
    }

    closeModal(): void {
        if (this.answering) return;
        this.showModal = false;
        this.selectedQuestion = null;
    }

    async submitAnswer(): Promise<void> {
        const q = this.selectedQuestion;
        if (!q?.id || !this.answerValid) return;

        this.answering = true;
        this.answerError = '';
        try {
            const text = this.answerText.trim();
            const resp = await this.marketplace.answerQuestion({ questionId: q.id, text });
            if (!resp.isSuccess) {
                this.answerError = resp.innerError || resp.errorCode || 'Cevap gönderilemedi.';
                return;
            }
            q.answer = { text, creationDate: Date.now() };
            q.status = 'WAITING_FOR_APPROVE';
            this.applyFilterAndPaging();
            this.answering = false;
            this.closeModal();
        } catch (err) {
            console.error('Soru cevaplanamadı:', err);
            this.answerError = this.errorText(err, 'Cevap gönderilemedi.');
        } finally {
            this.answering = false;
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExtensionRequestLogsService } from '@/app/core/services/extension-request-logs.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ClipboardService } from '@/app/core/services/clipboard.service';
import {
    ExtensionRequestLogResponse,
    ExtensionRequestLogSummaryResponse,
    ExtensionUsageReportResponse,
} from '@/app/core/models/extension-request-log/extension-request-log.models';
import { PagedResult } from '@/app/core/models/pagination.model';
import { parseLogDate } from '@/app/core/utils/log-date.util';

type SuccessFilter = 'all' | 'success' | 'failed';

@Component({
    selector: 'app-extension-request-logs-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './extension-request-logs.html',
    styleUrls: ['./extension-request-logs.scss'],
})
export class ExtensionRequestLogsPage implements OnInit {
    items: ExtensionRequestLogSummaryResponse[] = [];
    loading = false;

    // Datatable (server-side paging)
    filterText = '';
    filteredItems: ExtensionRequestLogSummaryResponse[] = [];
    pagedItems: ExtensionRequestLogSummaryResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    /** Gösterilecek sayfa numaraları; -1 = '…' ayracı */
    visiblePages: number[] = [];

    providerFilter = '';
    successFilter: SuccessFilter = 'all';
    providerOptions: string[] = [];

    usage: ExtensionUsageReportResponse | null = null;

    // Detay modal
    showModal = false;
    detailLoading = false;
    selectedLog: ExtensionRequestLogResponse | null = null;

    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private logsService: ExtensionRequestLogsService,
        private authStateService: AuthStateService,
        private clipboardService: ClipboardService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.loadUsage();
        this.loadLogs();
    }

    private get companyId(): string {
        return this.authStateService.profile?.companyId || '';
    }

    // ────── Veri ──────
    async loadLogs(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.logsService.getPaged({
                companyId: this.companyId || null,
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText.trim() || null,
                providerCode: this.providerFilter || null,
                isSuccess: this.successFilter === 'all' ? null : this.successFilter === 'success',
            });
            const paged = PagedResult.from<ExtensionRequestLogSummaryResponse>(resp);
            this.items = paged.items;
            this.totalCount = Number(paged.totalCount) || 0;
            this.totalPages = Math.max(1, Number(paged.totalPages) || Math.ceil(this.totalCount / this.pageSize) || 1);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Extension logları yüklenemedi:', err);
            this.items = [];
            this.totalCount = 0;
            this.totalPages = 1;
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    async loadUsage(): Promise<void> {
        try {
            const resp = await this.logsService.getUsageReport({ companyId: this.companyId || undefined });
            this.usage = resp?.data ?? null;
            this.providerOptions = (this.usage?.usageByProvider ?? [])
                .map(p => p.providerCode || '')
                .filter(code => !!code)
                .sort((a, b) => a.localeCompare(b, 'tr'));
        } catch (err) {
            console.error('Extension kullanım raporu yüklenemedi:', err);
            this.usage = null;
        }
    }

    // ────── Datatable ──────
    onFilterChange(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.currentPage = 1;
            this.loadLogs();
        }, 400);
    }

    onSelectFilterChange(): void {
        this.currentPage = 1;
        this.loadLogs();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadLogs();
    }

    applyFilterAndPaging(): void {
        // Filtre ve sayfalama sunucu tarafında yapılır
        this.filteredItems = [...this.items];
        this.pagedItems = this.filteredItems;
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        this.visiblePages = this.buildVisiblePages(this.currentPage, this.totalPages);
    }

    private buildVisiblePages(current: number, total: number, radius = 2): number[] {
        if (total <= radius * 2 + 5) return Array.from({ length: total }, (_, i) => i + 1);
        const start = Math.max(2, current - radius);
        const end = Math.min(total - 1, current + radius);
        const pages: number[] = [1];
        if (start > 2) pages.push(-1);
        for (let p = start; p <= end; p++) pages.push(p);
        if (end < total - 1) pages.push(-1);
        pages.push(total);
        return pages;
    }

    // ────── İşlemler ──────
    async openDetail(item: ExtensionRequestLogSummaryResponse): Promise<void> {
        this.selectedLog = { ...item, updatedDate: item.createdDate };
        this.showModal = true;
        this.detailLoading = true;
        try {
            const resp = await this.logsService.getById(item.id);
            if (resp?.data) this.selectedLog = resp.data;
        } catch (err) {
            console.error('Log detayı yüklenemedi:', err);
        } finally {
            this.detailLoading = false;
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedLog = null;
    }

    openConversationLogs(item: ExtensionRequestLogSummaryResponse): void {
        if (!item.conversationId) return;
        this.router.navigate(['/admin/conversation-logs'], { queryParams: { conversationId: item.conversationId } });
    }

    async deleteLog(item: ExtensionRequestLogSummaryResponse): Promise<void> {
        if (!confirm('Bu log kaydını silmek istediğinize emin misiniz?')) return;
        try {
            await this.logsService.delete(item.id);
            if (this.pagedItems.length === 1 && this.currentPage > 1) this.currentPage--;
            await this.loadLogs();
        } catch (err: any) {
            console.error('Log silinemedi:', err);
            alert('Log silinemedi: ' + (err?.error?.message || err?.error?.title || err?.message || 'Bilinmeyen hata'));
        }
    }

    async copy(text?: string | null): Promise<void> {
        if (!text) return;
        try {
            await this.clipboardService.copyText(this.formatJson(text));
        } catch (err) {
            console.error('Kopyalama hatası:', err);
        }
    }

    // ────── Format ──────
    /** Extension log tarihleri UTC tutulur; yerel saate çevrilmiş epoch döner */
    logTime(value?: string | null): number {
        return parseLogDate(value, 'utc');
    }

    formatDuration(ms?: number | null): string {
        if (ms === null || ms === undefined || isNaN(Number(ms))) return '—';
        const value = Number(ms);
        if (value < 1000) return `${Math.round(value)} ms`;
        return `${(value / 1000).toFixed(1)} sn`;
    }

    formatPercent(value?: number | null): string {
        // Backend 0-100 aralığında döner
        return `%${(Number(value) || 0).toFixed(1)}`;
    }

    formatJson(text?: string | null): string {
        if (!text) return '';
        try {
            return JSON.stringify(JSON.parse(text), null, 2);
        } catch {
            return text;
        }
    }

    private extractArray(response: unknown): ExtensionRequestLogSummaryResponse[] {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== 'object') return [];
        const source = response as { $values?: unknown; data?: unknown; items?: unknown; result?: unknown };
        if (Array.isArray(source.$values)) return source.$values as ExtensionRequestLogSummaryResponse[];
        if (Array.isArray(source.items)) return source.items as ExtensionRequestLogSummaryResponse[];
        if (Array.isArray(source.result)) return source.result as ExtensionRequestLogSummaryResponse[];
        if (Array.isArray(source.data)) return source.data as ExtensionRequestLogSummaryResponse[];
        return [];
    }
}

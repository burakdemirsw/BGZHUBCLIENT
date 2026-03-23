import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiRequestLogsService } from '@/app/core/services/ai-request-logs.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    AiRequestLogSummaryResponse,
    AiRequestLogResponse,
    AiReportFilterRequest,
    AiUsageReportResponse,
    AiErrorReportResponse,
    AiCostReportResponse,
} from '@/app/core/models/ai-request-log/ai-request-log.models';
import { PagedResult } from '@/app/core/models/pagination.model';

@Component({
    selector: 'app-ai-request-logs-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-request-logs.html',
    styleUrls: ['./ai-request-logs.scss'],
})
export class AiRequestLogsPage implements OnInit {
    items: AiRequestLogSummaryResponse[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: AiRequestLogSummaryResponse[] = [];
    pagedItems: AiRequestLogSummaryResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Server-side paging
    serverTotalCount = 0;
    serverTotalPages = 0;
    useServerPaging = true;

    // Filter: sadece hatalılar
    showOnlyFailed = false;

    // Detay modal
    showDetailModal = false;
    selectedItem: AiRequestLogResponse | null = null;
    detailLoading = false;

    // Aktif tab (request/response)
    activeTab: 'request' | 'response' = 'request';

    // ── Aktif sayfa sekmesi ──
    activeView: 'logs' | 'reports' = 'logs';

    // ── Rapor verileri ──
    usageReport: AiUsageReportResponse | null = null;
    errorReport: AiErrorReportResponse | null = null;
    costReport: AiCostReportResponse | null = null;
    reportsLoading = false;

    // ── Rapor filtre ──
    reportFilter: AiReportFilterRequest = {};

    constructor(
        private aiRequestLogsService: AiRequestLogsService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.reportFilter.companyId = this.authState.profile?.companyId || '';
        this.loadLogs();
    }

    // ── View Toggle ──
    switchView(view: 'logs' | 'reports'): void {
        this.activeView = view;
        if (view === 'reports' && !this.usageReport) {
            this.loadReports();
        }
    }

    // ── Rapor yükleme ──
    async loadReports(): Promise<void> {
        this.reportsLoading = true;
        try {
            const filter: AiReportFilterRequest = { ...this.reportFilter };
            const [usageResp, errorResp, costResp] = await Promise.all([
                this.aiRequestLogsService.getUsageReport(filter),
                this.aiRequestLogsService.getErrorReport(filter),
                this.aiRequestLogsService.getCostReport(filter),
            ]);
            this.usageReport = usageResp?.data ?? null;
            this.errorReport = errorResp?.data ?? null;
            this.costReport = costResp?.data ?? null;
        } catch (err) {
            console.error('Rapor yükleme hatası:', err);
        } finally {
            this.reportsLoading = false;
        }
    }

    applyReportFilter(): void {
        this.usageReport = null;
        this.errorReport = null;
        this.costReport = null;
        this.loadReports();
    }

    async loadLogs(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.aiRequestLogsService.getPaged({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText || undefined,
                sortBy: 'CreatedDate',
                sortDescending: true,
            });

            const pagedData = this.extractPagedResult(resp?.data);
            this.items = pagedData.items;
            this.serverTotalCount = pagedData.totalCount;
            this.serverTotalPages = pagedData.totalPages;
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AI Request Logs yükleme hatası:', err);
        } finally {
            this.loading = false;
        }
    }

    async openDetail(item: AiRequestLogSummaryResponse): Promise<void> {
        this.showDetailModal = true;
        this.detailLoading = true;
        this.selectedItem = null;
        this.activeTab = 'request';
        try {
            const resp = await this.aiRequestLogsService.getById(item.id);
            this.selectedItem = resp?.data ?? null;
        } catch (err) {
            console.error('Detay yükleme hatası:', err);
        } finally {
            this.detailLoading = false;
        }
    }

    closeDetailModal(): void {
        this.showDetailModal = false;
        this.selectedItem = null;
    }

    async deleteLog(item: AiRequestLogSummaryResponse): Promise<void> {
        if (confirm('Bu log kaydını silmek istediğinize emin misiniz?')) {
            try {
                await this.aiRequestLogsService.delete(item.id);
                await this.loadLogs();
            } catch (err) {
                console.error('Silme hatası:', err);
            }
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadLogs();
    }

    setPage(page: number): void {
        const maxPage = this.useServerPaging ? this.serverTotalPages : this.totalPages;
        if (page < 1 || page > maxPage) return;
        this.currentPage = page;
        this.loadLogs();
    }

    applyFilterAndPaging(): void {
        let data = [...this.items];

        if (this.showOnlyFailed) {
            data = data.filter(i => !i.isSuccess);
        }

        this.filteredItems = data;

        if (this.useServerPaging) {
            this.totalPages = this.serverTotalPages;
            this.pagedItems = this.filteredItems;
        } else {
            this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
            const start = (this.currentPage - 1) * this.pageSize;
            this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
        }

        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    toggleFailedFilter(): void {
        this.showOnlyFailed = !this.showOnlyFailed;
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    formatDuration(ms?: number): string {
        if (ms == null) return '—';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    formatCost(cost?: number): string {
        if (cost == null) return '—';
        return `$${cost.toFixed(6)}`;
    }

    formatTokens(tokens?: number): string {
        if (tokens == null) return '—';
        return tokens.toLocaleString('tr-TR');
    }

    formatJson(text?: string): string {
        if (!text) return '—';
        try {
            const parsed = JSON.parse(text);
            return JSON.stringify(parsed, null, 2);
        } catch {
            return text;
        }
    }

    private extractPagedResult(response: any): PagedResult<AiRequestLogSummaryResponse> {
        if (response instanceof PagedResult) return response;
        const raw = response?.data ?? response?.result ?? response ?? {};
        const paged = raw?.items !== undefined ? raw : (raw?.data ?? raw);
        return {
            items: this.extractArray(paged?.items ?? paged?.$values ?? paged),
            pageNumber: paged?.pageNumber ?? 1,
            pageSize: paged?.pageSize ?? this.pageSize,
            totalCount: paged?.totalCount ?? 0,
            totalPages: paged?.totalPages ?? 0,
            hasPreviousPage: paged?.hasPreviousPage ?? false,
            hasNextPage: paged?.hasNextPage ?? false,
        };
    }

    private extractArray(response: any): AiRequestLogSummaryResponse[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

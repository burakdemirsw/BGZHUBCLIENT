import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiToolGapsService } from '@/app/core/services/ai-tool-gaps.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    AiToolGapReasonResponse,
    AiToolGapResponse,
    UpdateAiToolGapReasonRequest,
    UpdateAiToolGapRequest,
} from '@/app/core/models/ai-tool-gap/ai-tool-gap.models';
import { PagedResult } from '@/app/core/models/pagination.model';

type ResolvedFilter = 'all' | 'open' | 'resolved';

@Component({
    selector: 'app-ai-tool-gaps-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './ai-tool-gaps.html',
    styleUrls: ['./ai-tool-gaps.scss'],
})
export class AiToolGapsPage implements OnInit {
    activeView: 'gaps' | 'reasons' = 'gaps';

    // ── Tool Gap datatable (server-side paging) ──
    items: AiToolGapResponse[] = [];
    loading = false;

    filterText = '';
    filteredItems: AiToolGapResponse[] = [];
    pagedItems: AiToolGapResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
    totalCount = 0;

    reasonFilter = '';
    resolvedFilter: ResolvedFilter = 'all';

    // ── Detay / çözüm modal ──
    showModal = false;
    selectedItem: AiToolGapResponse | null = null;
    detailLoading = false;
    saving = false;
    resolveForm: UpdateAiToolGapRequest = { isResolved: false, resolutionNote: '' };

    // ── Nedenler datatable (client-side paging) ──
    reasons: AiToolGapReasonResponse[] = [];
    reasonsLoading = false;

    reasonFilterText = '';
    filteredReasons: AiToolGapReasonResponse[] = [];
    pagedReasons: AiToolGapReasonResponse[] = [];
    reasonCurrentPage = 1;
    reasonTotalPages = 1;
    reasonTotalPagesArray: number[] = [];

    showReasonModal = false;
    reasonSaving = false;
    editingReason: AiToolGapReasonResponse | null = null;
    reasonForm: UpdateAiToolGapReasonRequest = { name: '', description: '', isActive: true, sortOrder: 0 };

    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(
        private aiToolGapsService: AiToolGapsService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadReasons();
        this.loadGaps();
    }

    switchView(view: 'gaps' | 'reasons'): void {
        this.activeView = view;
    }

    // ══════════════ Tool Gaps ══════════════

    async loadGaps(): Promise<void> {
        this.loading = true;
        try {
            const resp = await this.aiToolGapsService.getPaged({
                companyId: this.authStateService.profile?.companyId || null,
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText.trim() || null,
                aiToolGapReasonId: this.reasonFilter || null,
                isResolved: this.resolvedFilter === 'all' ? null : this.resolvedFilter === 'resolved',
            });
            const paged = PagedResult.from<AiToolGapResponse>(resp?.data);
            this.items = paged.items;
            this.totalCount = Number(paged.totalCount) || 0;
            this.totalPages = Math.max(1, Number(paged.totalPages) || 1);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('AI Tool Gaps yükleme hatası:', err);
            this.items = [];
            this.totalCount = 0;
            this.totalPages = 1;
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    onFilterChange(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.currentPage = 1;
            this.loadGaps();
        }, 400);
    }

    onSelectFilterChange(): void {
        this.currentPage = 1;
        this.loadGaps();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.loadGaps();
    }

    applyFilterAndPaging(): void {
        // Filtre ve sayfalama sunucu tarafında yapılır
        this.filteredItems = [...this.items];
        this.pagedItems = this.filteredItems;
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    async openDetail(item: AiToolGapResponse): Promise<void> {
        this.selectedItem = item;
        this.resolveForm = { isResolved: item.isResolved, resolutionNote: item.resolutionNote ?? '' };
        this.showModal = true;
        this.detailLoading = true;
        try {
            const resp = await this.aiToolGapsService.getById(item.id);
            if (resp?.data) {
                this.selectedItem = resp.data;
                this.resolveForm = { isResolved: resp.data.isResolved, resolutionNote: resp.data.resolutionNote ?? '' };
            }
        } catch (err) {
            console.error('Tool gap detay hatası:', err);
        } finally {
            this.detailLoading = false;
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedItem = null;
    }

    async saveResolution(): Promise<void> {
        if (!this.selectedItem) return;
        this.saving = true;
        try {
            await this.aiToolGapsService.update(this.selectedItem.id, {
                isResolved: this.resolveForm.isResolved,
                resolutionNote: this.resolveForm.resolutionNote?.trim() || null,
            });
            this.closeModal();
            await this.loadGaps();
        } catch (err) {
            console.error('Tool gap güncelleme hatası:', err);
            alert('Kayıt güncellenemedi.');
        } finally {
            this.saving = false;
        }
    }

    async deleteGap(item: AiToolGapResponse): Promise<void> {
        if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
        try {
            await this.aiToolGapsService.delete(item.id);
            if (this.pagedItems.length === 1 && this.currentPage > 1) this.currentPage--;
            await this.loadGaps();
        } catch (err) {
            console.error('Tool gap silme hatası:', err);
            alert('Kayıt silinemedi.');
        }
    }

    formatJson(value?: string | null): string {
        if (!value) return '';
        try {
            return JSON.stringify(JSON.parse(value), null, 2);
        } catch {
            return value;
        }
    }

    // ══════════════ Nedenler ══════════════

    async loadReasons(): Promise<void> {
        this.reasonsLoading = true;
        try {
            const resp = await this.aiToolGapsService.getReasons();
            this.reasons = this.extractArray(resp?.data)
                .sort((a, b) => Number(a.sortOrder) - Number(b.sortOrder));
            this.applyReasonFilterAndPaging();
        } catch (err) {
            console.error('Tool gap nedenleri yükleme hatası:', err);
            this.reasons = [];
            this.applyReasonFilterAndPaging();
        } finally {
            this.reasonsLoading = false;
        }
    }

    onReasonFilterChange(): void {
        this.reasonCurrentPage = 1;
        this.applyReasonFilterAndPaging();
    }

    setReasonPage(page: number): void {
        if (page < 1 || page > this.reasonTotalPages) return;
        this.reasonCurrentPage = page;
        this.applyReasonFilterAndPaging();
    }

    applyReasonFilterAndPaging(): void {
        const filter = this.reasonFilterText.toLowerCase();
        this.filteredReasons = this.reasons.filter(r =>
            (r.code || '').toLowerCase().includes(filter) ||
            (r.name || '').toLowerCase().includes(filter) ||
            (r.description || '').toLowerCase().includes(filter)
        );
        this.reasonTotalPages = Math.max(1, Math.ceil(this.filteredReasons.length / this.pageSize));
        this.reasonTotalPagesArray = Array.from({ length: this.reasonTotalPages }, (_, i) => i + 1);
        if (this.reasonCurrentPage > this.reasonTotalPages) this.reasonCurrentPage = this.reasonTotalPages;
        const start = (this.reasonCurrentPage - 1) * this.pageSize;
        this.pagedReasons = this.filteredReasons.slice(start, start + this.pageSize);
    }

    openReasonModal(reason: AiToolGapReasonResponse): void {
        this.editingReason = reason;
        this.reasonForm = {
            name: reason.name ?? '',
            description: reason.description ?? '',
            isActive: reason.isActive,
            sortOrder: Number(reason.sortOrder) || 0,
        };
        this.showReasonModal = true;
    }

    closeReasonModal(): void {
        this.showReasonModal = false;
        this.editingReason = null;
    }

    async saveReason(): Promise<void> {
        if (!this.editingReason) return;
        if (!this.reasonForm.name?.trim()) {
            alert('Ad alanı zorunludur.');
            return;
        }
        this.reasonSaving = true;
        try {
            await this.aiToolGapsService.updateReason(this.editingReason.id, {
                name: this.reasonForm.name.trim(),
                description: this.reasonForm.description?.trim() || null,
                isActive: this.reasonForm.isActive,
                sortOrder: Number(this.reasonForm.sortOrder) || 0,
            });
            this.closeReasonModal();
            await this.loadReasons();
        } catch (err) {
            console.error('Tool gap nedeni güncelleme hatası:', err);
            alert('Neden güncellenemedi.');
        } finally {
            this.reasonSaving = false;
        }
    }

    private extractArray(response: unknown): AiToolGapReasonResponse[] {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== 'object') return [];
        const source = response as { $values?: unknown; data?: unknown; items?: unknown; result?: unknown };
        if (Array.isArray(source.$values)) return source.$values as AiToolGapReasonResponse[];
        if (Array.isArray(source.data)) return source.data as AiToolGapReasonResponse[];
        if (Array.isArray(source.items)) return source.items as AiToolGapReasonResponse[];
        if (Array.isArray(source.result)) return source.result as AiToolGapReasonResponse[];
        return [];
    }
}

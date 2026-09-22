import { Directive, OnDestroy, OnInit } from '@angular/core';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';

/** Aramada her tuş vuruşunda istek atmamak için beklenen süre (ms) */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * WMS liste sayfalarının ortak temeli.
 *
 * Sayfalama ve arama sunucu tarafında yapılır: `POST {resource}/paged` ucu
 * `PaginationRequest` alıp `PagedResult` döner. Böylece hareket tabloları
 * (stok, sipariş, fatura) tarayıcıya tümüyle indirilmez.
 *
 * Alt sınıf yalnızca sayfanın nasıl çekileceğini (`fetchPage`) tanımlar.
 */
@Directive()
export abstract class WmsListPage<T extends { id: string }> implements OnInit, OnDestroy {
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: T | null = null;
    togglingId: string | null = null;

    /** Geçerli sayfadaki kayıtlar */
    pagedItems: T[] = [];

    // Datatable arama & sayfalama durumu
    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    hasPreviousPage = false;
    hasNextPage = false;

    private searchTimer: ReturnType<typeof setTimeout> | null = null;

    /** Sunucudan tek sayfa getirir */
    protected abstract fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<T>>;

    ngOnInit(): void {
        void this.loadItems();
    }

    ngOnDestroy(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
    }

    // ────── Datatable ──────
    /** Arama kutusu — yazma durduktan sonra tek istek atılır */
    onFilterChange(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            this.currentPage = 1;
            void this.loadItems();
        }, SEARCH_DEBOUNCE_MS);
    }

    /** Arama dışındaki filtreler (tarih, durum, tip) değiştiğinde ilk sayfadan yeniden yükler */
    applyFilters(): void {
        if (this.searchTimer) clearTimeout(this.searchTimer);
        this.currentPage = 1;
        void this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        void this.loadItems();
    }

    /** Listedeki sıra numarası (sayfalamayı hesaba katar) */
    rowNumber(index: number): number {
        return (this.currentPage - 1) * this.pageSize + index + 1;
    }

    // ────── Veri ──────
    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const page = await this.fetchPage({
                pageNumber: this.currentPage,
                pageSize: this.pageSize,
                searchTerm: this.filterText.trim() || undefined,
            });
            this.applyPage(page);
        } catch (err) {
            console.error('WMS liste yükleme hatası:', err);
            this.applyPage(null);
        } finally {
            this.loading = false;
        }
    }

    private applyPage(page: PagedResult<T> | null): void {
        this.pagedItems = page?.items ?? [];
        this.totalCount = page?.totalCount ?? 0;
        this.totalPages = Math.max(1, page?.totalPages ?? 1);
        this.hasPreviousPage = page?.hasPreviousPage ?? false;
        this.hasNextPage = page?.hasNextPage ?? false;
        this.totalPagesArray = this.buildPageLinks();

        // Son kayıt silindiğinde boş sayfada kalınmaz
        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
            void this.loadItems();
        }
    }

    /**
     * Sayfa bağlantıları. Toplam sayfa çoksa geçerli sayfanın çevresindeki
     * pencere gösterilir; aksi halde binlerce bağlantı basılırdı.
     */
    private buildPageLinks(): number[] {
        const windowSize = 7;
        if (this.totalPages <= windowSize) {
            return Array.from({ length: this.totalPages }, (_, i) => i + 1);
        }
        const half = Math.floor(windowSize / 2);
        let start = Math.max(1, this.currentPage - half);
        const end = Math.min(this.totalPages, start + windowSize - 1);
        start = Math.max(1, end - windowSize + 1);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    closeModal(): void {
        this.showModal = false;
    }

    /**
     * Satır içi Aktif/Pasif switch'inin ortak akışı: istek sürerken switch kilitli
     * kalır, başarılıysa kayıt yerinde güncellenir, hata olursa eski durumunda kalır.
     */
    protected async toggleWith(
        item: T,
        update: () => Promise<unknown>,
        commit: () => void,
    ): Promise<void> {
        if (this.togglingId) return;
        this.togglingId = item.id;
        try {
            await update();
            commit();
        } catch (err) {
            console.error('Durum güncelleme hatası:', err);
            alert('Durum güncellenemedi: ' + this.errorMessage(err));
        } finally {
            this.togglingId = null;
        }
    }

    // ────── Yardımcı ──────
    /**
     * Seçim listesi yanıtlarını normalize eder. API farklı sarmalayıcılarla
     * dönebildiği için dizi, `$values`, `data`, `items` ve `result` desteklenir.
     */
    protected extractArray<TItem = T>(response: any): TItem[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    protected errorMessage(err: any): string {
        if (err?.status === 0) return `Sunucuya bağlanılamadı. (${err?.url ?? ''})`;
        return (
            err?.error?.message ??
            err?.error?.title ??
            err?.innerError ??
            err?.message ??
            'Bilinmeyen hata'
        );
    }
}

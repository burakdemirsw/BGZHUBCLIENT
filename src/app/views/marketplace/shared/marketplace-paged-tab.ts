import { Directive, OnInit } from '@angular/core';
import { ApiResponse } from '@/app/core/models/api-response.model';

/** Sekmenin sunucudan aldığı sayfa; toplam bilgisi olmayan uç noktalar için hasNext kullanılır */
export interface PageResult<T> {
    items: T[];
    totalCount?: number | null;
    totalPages?: number | null;
    hasNext?: boolean | null;
}

/**
 * Pazaryeri sekmelerinin ortak datatable davranışı.
 * Sayfalama sunucu tarafında, filterText ise yüklenen sayfa içinde uygulanır.
 */
@Directive()
export abstract class MarketplacePagedTab<T> implements OnInit {
    items: T[] = [];
    loading = false;
    errorMessage = '';

    // Datatable
    filterText = '';
    filteredItems: T[] = [];
    pagedItems: T[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    /** API toplam kayıt sayısını döndürüyor mu? */
    knownTotal = false;

    /** Sunucudan sayfa verisini çeker (page: 1 tabanlı) */
    protected abstract fetchPage(page: number, size: number): Promise<PageResult<T>>;

    /** filterText ile eşleştirilecek metin */
    protected abstract searchText(item: T): string;

    ngOnInit(): void {
        this.load();
    }

    async load(): Promise<void> {
        this.loading = true;
        this.errorMessage = '';
        try {
            const result = await this.fetchPage(this.currentPage, this.pageSize);
            this.items = result.items ?? [];
            this.knownTotal = result.totalCount !== null && result.totalCount !== undefined;
            this.totalCount = this.knownTotal ? Number(result.totalCount) || 0 : this.items.length;

            if (result.totalPages !== null && result.totalPages !== undefined) {
                this.totalPages = Math.max(1, Number(result.totalPages) || 1);
            } else if (this.knownTotal) {
                this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize) || 1);
            } else {
                // Toplam bilinmiyor: sonraki sayfa varsa ileri gitmeye izin ver
                const hasNext = result.hasNext ?? this.items.length === this.pageSize;
                this.totalPages = hasNext ? this.currentPage + 1 : this.currentPage;
            }
        } catch (err) {
            console.error('Pazaryeri verileri yüklenemedi:', err);
            this.errorMessage = this.errorText(err, 'Pazaryeri verileri yüklenemedi.');
            this.items = [];
            this.totalCount = 0;
            this.totalPages = 1;
        } finally {
            this.applyFilterAndPaging();
            this.loading = false;
        }
    }

    onFilterChange(): void {
        this.applyFilterAndPaging();
    }

    /** Sunucu tarafı filtre (durum, tarih vb.) değiştiğinde ilk sayfadan yeniden yükler */
    onServerFilterChange(): void {
        this.currentPage = 1;
        this.load();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.currentPage) return;
        this.currentPage = page;
        this.load();
    }

    applyFilterAndPaging(): void {
        const term = this.filterText.trim().toLocaleLowerCase('tr');
        this.filteredItems = term
            ? this.items.filter(item => this.searchText(item).toLocaleLowerCase('tr').includes(term))
            : [...this.items];
        this.pagedItems = this.filteredItems;
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    }

    /** Yanıt başarısızsa hata mesajını kaydeder ve null döner */
    protected unwrap<D>(response: ApiResponse<D>): D | null {
        if (!response.isSuccess) {
            this.errorMessage = response.innerError || response.errorCode || 'Veriler alınamadı.';
        }
        return response.data ?? null;
    }

    protected extractArray(response: any): T[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    /** 'yyyy-MM-dd' input değerini ISO tarih-saatine çevirir */
    protected toIsoDate(value: string, endOfDay = false): string | null {
        if (!value) return null;
        const date = new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`);
        return Number.isFinite(date.getTime()) ? date.toISOString() : null;
    }

    protected errorText(err: unknown, fallback: string): string {
        const body = (err as { error?: { innerError?: string; errorCode?: string } })?.error;
        return body?.innerError || body?.errorCode || fallback;
    }
}

import { Directive, OnInit } from '@angular/core';
import { ApiResponse } from '@/app/core/models/api-response.model';

/**
 * WMS liste sayfalarının ortak temeli.
 *
 * Proje kuralındaki zorunlu datatable yapısını (arama filtresi + sayfalama +
 * `filterText` / `filteredItems` / `pagedItems` / `currentPage` / `pageSize` /
 * `totalPages` / `totalPagesArray` ve `onFilterChange` / `setPage` /
 * `applyFilterAndPaging`) tek yerde karşılar; ~58 WMS sayfasında tekrarlanmaz.
 *
 * Alt sınıf yalnızca veriyi nasıl çekeceğini (`fetchItems`) ve hangi alanlarda
 * arama yapılacağını (`filterFields`) tanımlar.
 */
@Directive()
export abstract class WmsListPage<T extends { id: string }> implements OnInit {
    items: T[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: T | null = null;
    togglingId: string | null = null;

    // Datatable filter & pagination
    filterText = '';
    filteredItems: T[] = [];
    pagedItems: T[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    /** Listeyi dolduran API çağrısı */
    protected abstract fetchItems(): Promise<ApiResponse<T[]>>;

    /** Arama filtresinin tarayacağı alanlar */
    protected abstract filterFields(item: T): (string | number | null | undefined)[];

    ngOnInit(): void {
        void this.loadItems();
    }

    // ────── Datatable ──────
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
        const filter = (this.filterText || '').toLowerCase();
        this.filteredItems = filter
            ? this.items.filter(item =>
                  this.filterFields(item).some(field =>
                      String(field ?? '').toLowerCase().includes(filter),
                  ),
              )
            : [...this.items];

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    /** Listedeki sıra numarası (sayfalamayı hesaba katar) */
    rowNumber(index: number): number {
        return (this.currentPage - 1) * this.pageSize + index + 1;
    }

    // ────── Veri ──────
    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.fetchItems();
            this.items = this.extractArray(response?.data);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('WMS liste yükleme hatası:', err);
            this.items = [];
            this.applyFilterAndPaging();
        } finally {
            this.loading = false;
        }
    }

    closeModal(): void {
        this.showModal = false;
    }

    /**
     * Satır içi Aktif/Pasif switch'inin ortak akışı: istek sürerken switch kilitli
     * kalır, başarılıysa kayıt yerinde güncellenir, hata olursa eski durumda kalır.
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
     * API farklı sarmalayıcılarla dönebildiği için liste normalize edilir.
     * Lookup listeleri için `TItem` ile başka bir tipe de daraltılabilir.
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

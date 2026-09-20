import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BeymenMarketplaceService } from '@/app/core/services/beymen-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { DynamicTable } from '../../shared/dynamic-table/dynamic-table';
import { ToolRow, parseToolResult } from '../../shared/tool-result.util';

/**
 * Beymen siparişleri `MarketplaceToolResult.dataJson` içinde şemasız JSON olarak gelir.
 * Satırlarda sipariş numarası alanı bulunursa sabit kolonlu tablo, aksi halde adaptif tablo çizilir.
 */
@Component({
    selector: 'app-beymen-orders',
    imports: [CommonModule, FormsModule, TablePager, DynamicTable],
    templateUrl: './beymen-orders.html',
    styleUrls: ['./beymen-orders.scss'],
})
export class BeymenOrdersPage extends MarketplacePagedTab<ToolRow> {
    private marketplace = inject(BeymenMarketplaceService);

    /** Sipariş numarasının gelebileceği alan adları */
    private readonly orderNumberKeys = ['orderNumber', 'orderNo', 'siparisNo', 'orderCode'];

    orderNumberFilter = '';
    shipmentStatusFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedRow: ToolRow | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<ToolRow>> {
        const result = this.unwrap(await this.marketplace.getOrders({
            orderNumber: this.orderNumberFilter.trim() || null,
            shipmentStatus: this.shipmentStatusFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            page: page - 1,
            size,
        }));
        const { rows, rowCount, error } = parseToolResult(result);
        if (error) this.errorMessage = error;
        // rowCount çoğu zaman sadece bu sayfadaki kayıt sayısıdır; toplam bilinmiyorsa pager "N. sayfa" modunda çalışır
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

    /** Satırlarda sipariş numarası var mı? (sabit kolonlu tablo çizilsin mi) */
    get hasOrderShape(): boolean {
        return this.pagedItems.some(row => this.orderNumberKeys.some(key => this.has(row, key)));
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

    orderNumberText(row: ToolRow): string {
        return this.text(row, ...this.orderNumberKeys);
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

    /** Tutar + para birimi */
    priceText(row: ToolRow): string {
        const amount = this.num(row, 'totalPrice', 'amount', 'totalAmount', 'grandTotal', 'price');
        if (amount === null) return '-';
        const currency = this.text(row, 'currency', 'currencyCode');
        const formatted = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return currency === '-' ? formatted : `${formatted} ${currency}`;
    }

    statusClass(status: string): string {
        const value = status.toLocaleLowerCase('tr');
        if (value.includes('teslim edildi') || value.includes('delivered') || value.includes('tamamla')) {
            return 'bg-success-subtle text-success';
        }
        if (value.includes('iptal') || value.includes('cancel') || value.includes('iade') || value.includes('return')) {
            return 'bg-danger-subtle text-danger';
        }
        if (value.includes('kargo') || value.includes('ship')) return 'bg-info-subtle text-info';
        if (value.includes('bekl') || value.includes('wait') || value.includes('hazır') || value.includes('new')) {
            return 'bg-warning-subtle text-warning';
        }
        return 'bg-primary-subtle text-primary';
    }

    clearFilters(): void {
        this.orderNumberFilter = '';
        this.shipmentStatusFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.filterText = '';
        this.onServerFilterChange();
    }

    openDetail(row: ToolRow): void {
        this.selectedRow = row;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedRow = null;
    }

    get selectedJson(): string {
        return this.selectedRow ? JSON.stringify(this.selectedRow, null, 2) : '';
    }

    private formatDate(date: Date): string {
        if (!Number.isFinite(date.getTime())) return '-';
        return date.toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    }
}

import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolRow } from '../tool-result.util';

/** Teknik kimlik alanları UI'de gösterilmez */
const HIDDEN_KEY = /(^id$|id$|guid|uuid|token|secret)/i;
const LABELS: Record<string, string> = {
    orderNumber: 'Sipariş No',
    orderDate: 'Sipariş Tarihi',
    status: 'Durum',
    statusName: 'Durum',
    customerName: 'Müşteri',
    fullName: 'Müşteri',
    productName: 'Ürün',
    quantity: 'Adet',
    totalPrice: 'Tutar',
    price: 'Fiyat',
    barcode: 'Barkod',
    question: 'Soru',
    answer: 'Cevap',
    subject: 'Konu',
    createdAt: 'Oluşturma',
    createdDate: 'Oluşturma',
    modifiedAt: 'Güncelleme',
    brandName: 'Marka',
    modelCode: 'Model Kodu',
    color: 'Renk',
    size: 'Beden',
    shipmentStatus: 'Kargo Durumu',
};

/**
 * `dataJson` ile gelen, şeması tanımlı olmayan kayıtları tablo olarak gösterir.
 * Kolonlar satırlardaki alanlardan türetilir; tam kayıt detay penceresinde JSON olarak görülebilir.
 */
@Component({
    selector: 'app-dynamic-table',
    imports: [CommonModule],
    templateUrl: './dynamic-table.html',
    styleUrls: ['./dynamic-table.scss'],
})
export class DynamicTable implements OnChanges {
    @Input() rows: ToolRow[] = [];
    @Input() maxColumns = 7;
    @Input() emptyText = 'Kayıt bulunamadı.';

    columns: string[] = [];
    showModal = false;
    selectedRow: ToolRow | null = null;

    ngOnChanges(): void {
        const keys: string[] = [];
        for (const row of this.rows) {
            for (const key of Object.keys(row)) {
                if (keys.includes(key) || HIDDEN_KEY.test(key)) continue;
                const value = row[key];
                if (value !== null && typeof value === 'object') continue;
                keys.push(key);
            }
        }
        this.columns = keys.slice(0, this.maxColumns);
    }

    label(key: string): string {
        if (LABELS[key]) return LABELS[key];
        const spaced = key.replace(/[_-]/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        return spaced.charAt(0).toLocaleUpperCase('tr') + spaced.slice(1);
    }

    format(value: unknown): string {
        if (value === null || value === undefined || value === '') return '-';
        if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
        return String(value);
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
}

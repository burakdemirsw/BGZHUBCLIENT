import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicimaxMarketplaceService } from '@/app/core/services/ticimax-marketplace.service';
import { MarketplacePagedTab, PageResult } from '../../shared/marketplace-paged-tab';
import { TablePager } from '../../shared/table-pager/table-pager';
import { WebSiparis, WebSiparisUrun } from '@/app/core/models/marketplace/ticimax.models';

@Component({
    selector: 'app-ticimax-orders',
    imports: [CommonModule, FormsModule, TablePager],
    templateUrl: './ticimax-orders.html',
    styleUrls: ['./ticimax-orders.scss'],
})
export class TicimaxOrdersPage extends MarketplacePagedTab<WebSiparis> {
    private marketplace = inject(TicimaxMarketplaceService);

    orderNumberFilter = '';
    startDate = '';
    endDate = '';

    showModal = false;
    selectedOrder: WebSiparis | null = null;

    protected async fetchPage(page: number, size: number): Promise<PageResult<WebSiparis>> {
        const data = this.unwrap(await this.marketplace.getOrders({
            orderNumber: this.orderNumberFilter.trim() || null,
            startDate: this.toIsoDate(this.startDate),
            endDate: this.toIsoDate(this.endDate, true),
            page,
            pageSize: size,
        }));
        const items = this.extractArray(data);
        // Uç nokta toplam kayıt bilgisi döndürmüyor; dolu sayfa varsa sonraki sayfaya izin verilir
        return { items, hasNext: items.length === size };
    }

    protected searchText(o: WebSiparis): string {
        return [
            o.siparisNo, o.siparisKodu, o.adiSoyadi, o.mail, o.siparisDurumu,
            o.kargoFirmaTanim, o.kargoTakipNo,
            ...(o.urunler ?? []).flatMap(u => [u.urunAdi, u.stokKodu, u.barkod]),
        ].filter(Boolean).join(' ');
    }

    statusClass(status: string | null | undefined): string {
        const s = (status || '').toLocaleLowerCase('tr');
        if (s.includes('teslim edildi') || s.includes('tamamland')) return 'bg-success-subtle text-success';
        if (s.includes('kargo')) return 'bg-info-subtle text-info';
        if (s.includes('iptal') || s.includes('iade') || s.includes('reddedil')) return 'bg-danger-subtle text-danger';
        if (s.includes('bekle') || s.includes('onay')) return 'bg-warning-subtle text-warning';
        return 'bg-primary-subtle text-primary';
    }

    stockCount(o: WebSiparis): number {
        return (o.urunler ?? []).reduce((sum, u) => sum + (Number(u.adet) || 0), 0);
    }

    firstProductName(o: WebSiparis): string {
        return (o.urunler ?? [])[0]?.urunAdi || '-';
    }

    lineTotal(u: WebSiparisUrun): number {
        return (Number(u.satisAniIndirimliFiyat) || 0) * (Number(u.adet) || 0);
    }

    customerName(o: WebSiparis): string {
        const full = (o.adiSoyadi || '').trim();
        if (full) return full;
        return [o.uyeAdi, o.uyeSoyadi].filter(Boolean).join(' ').trim() || '-';
    }

    clearFilters(): void {
        this.orderNumberFilter = '';
        this.startDate = '';
        this.endDate = '';
        this.onServerFilterChange();
    }

    openDetail(order: WebSiparis): void {
        this.selectedOrder = order;
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.selectedOrder = null;
    }
}

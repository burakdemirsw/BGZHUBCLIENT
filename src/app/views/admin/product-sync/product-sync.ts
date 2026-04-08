import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageSearchService } from '@/app/core/services/image-search.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { Integration } from '@/app/core/models/integration/integration.models';
import {
    FeedSyncHealthRequest,
    FeedSyncHealthResponse,
    FeedSyncJobResponse,
    PurgeAllProductsResponse,
    MissingProductItem,
} from '@/app/core/models/image-search/image-search.models';

@Component({
    selector: 'app-product-sync-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './product-sync.html',
    styleUrls: ['./product-sync.scss'],
})
export class ProductSyncPage implements OnInit {
    // ── Entegrasyonlar ──
    integrations: Integration[] = [];
    integrationsLoading = false;
    selectedIntegrationId = '';

    // ── Sağlık Durumu ──
    health: FeedSyncHealthResponse | null = null;
    healthLoading = false;
    healthError = '';

    // ── Senkronizasyon ──
    syncLoading = false;
    syncResult: FeedSyncJobResponse | null = null;
    syncError = '';

    // ── Purge ──
    purgeLoading = false;
    purgeResult: PurgeAllProductsResponse | null = null;
    purgeError = '';
    showPurgeConfirm = false;

    // ── Detay Paneli ──
    activeDetail: 'missing-db' | 'missing-emb' | null = null;
    detailItems: MissingProductItem[] = [];
    detailLoading = false;
    detailError = '';
    detailPage = 1;
    detailPageSize = 20;
    detailTotalCount = 0;
    detailTotalPages = 1;

    // ── Son işlem zamanları ──
    lastHealthCheck: Date | null = null;
    lastSyncTime: Date | null = null;

    constructor(
        private imageSearchService: ImageSearchService,
        private integrationsService: IntegrationsService,
        private authState: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadIntegrations();
    }

    // ────── Entegrasyonları Yükle ──────
    async loadIntegrations(): Promise<void> {
        this.integrationsLoading = true;
        try {
            const companyId = this.authState.profile?.companyId || '';
            const response = await this.integrationsService.getPaged({
                companyId,
                pageNumber: 1,
                pageSize: 1000,
            });
            const paged = response?.data;
            this.integrations = (paged?.items ?? []).filter((i: Integration) => !i.isBlocked);
        } catch (err) {
            console.error('Entegrasyon yükleme hatası:', err);
        } finally {
            this.integrationsLoading = false;
        }
    }

    // ────── Entegrasyon Seçildiğinde ──────
    onIntegrationChange(): void {
        this.health = null;
        this.healthError = '';
        this.syncResult = null;
        this.syncError = '';
        this.purgeResult = null;
        this.purgeError = '';
        this.lastHealthCheck = null;
        this.lastSyncTime = null;
        this.closeDetail();

        if (this.selectedIntegrationId) {
            this.loadHealth();
        }
    }

    getSelectedIntegrationName(): string {
        const item = this.integrations.find(i => i.id === this.selectedIntegrationId);
        return item?.integrationDescription || '—';
    }

    // ────── Request Builder ──────
    private buildRequest(): FeedSyncHealthRequest {
        return {
            companyId: this.authState.profile?.companyId || '',
            integrationId: this.selectedIntegrationId,
        };
    }

    // ────── Sağlık Kontrolü ──────
    async loadHealth(): Promise<void> {
        if (!this.selectedIntegrationId) return;
        this.healthLoading = true;
        this.healthError = '';
        try {
            const resp = await this.imageSearchService.feedHealth(this.buildRequest());
            this.health = resp?.data ?? null;
            this.lastHealthCheck = new Date();
        } catch (err: any) {
            console.error('Feed health hatası:', err);
            this.healthError = err?.error?.message || err?.message || 'Sağlık durumu alınamadı.';
        } finally {
            this.healthLoading = false;
        }
    }

    // ────── Senkronizasyon ──────
    async runSync(): Promise<void> {
        if (!this.selectedIntegrationId) return;
        this.syncLoading = true;
        this.syncError = '';
        this.syncResult = null;
        try {
            const resp = await this.imageSearchService.syncAndReport(this.buildRequest());
            this.syncResult = resp?.data ?? null;
            this.lastSyncTime = new Date();
            // Sağlık verisini yeniden yükle
            await this.loadHealth();
        } catch (err: any) {
            console.error('Sync hatası:', err);
            this.syncError = err?.error?.message || err?.message || 'Senkronizasyon başarısız.';
        } finally {
            this.syncLoading = false;
        }
    }

    // ────── Tüm Verileri Sil ──────
    openPurgeConfirm(): void {
        this.showPurgeConfirm = true;
    }

    closePurgeConfirm(): void {
        this.showPurgeConfirm = false;
    }

    async confirmPurge(): Promise<void> {
        this.purgeLoading = true;
        this.purgeError = '';
        this.purgeResult = null;
        this.showPurgeConfirm = false;
        try {
            const resp = await this.imageSearchService.purgeAll(this.buildRequest());
            this.purgeResult = resp?.data ?? null;
            if (this.selectedIntegrationId) {
                await this.loadHealth();
            }
        } catch (err: any) {
            console.error('Purge hatası:', err);
            this.purgeError = err?.error?.message || err?.message || 'Silme işlemi başarısız.';
        } finally {
            this.purgeLoading = false;
        }
    }

    // ────── Detay Paneli ──────
    async openDetail(type: 'missing-db' | 'missing-emb'): Promise<void> {
        // Toggle: aynı tipe tekrar basılırsa kapat
        if (this.activeDetail === type) {
            this.closeDetail();
            return;
        }
        // Count 0 ise açma
        if (type === 'missing-db' && this.health?.missingInDb === 0) return;
        if (type === 'missing-emb' && this.health?.missingEmbeddings === 0) return;

        this.activeDetail = type;
        this.detailPage = 1;
        await this.loadDetailPage();
    }

    closeDetail(): void {
        this.activeDetail = null;
        this.detailItems = [];
        this.detailError = '';
        this.detailTotalCount = 0;
        this.detailTotalPages = 1;
    }

    async loadDetailPage(): Promise<void> {
        if (!this.activeDetail || !this.selectedIntegrationId) return;
        this.detailLoading = true;
        this.detailError = '';
        try {
            const request = this.buildRequest();
            let resp: any;
            if (this.activeDetail === 'missing-db') {
                resp = await this.imageSearchService.getMissingInDb(request, this.detailPage, this.detailPageSize);
            } else {
                resp = await this.imageSearchService.getMissingEmbeddings(request, this.detailPage, this.detailPageSize);
            }
            this.detailItems = this.extractArray(resp?.data);
            this.detailTotalCount = resp?.dataCount ?? this.detailItems.length;
            this.detailTotalPages = Math.max(1, Math.ceil(this.detailTotalCount / this.detailPageSize));
        } catch (err: any) {
            console.error('Detail load hatası:', err);
            this.detailError = err?.error?.message || err?.message || 'Veri yüklenemedi.';
        } finally {
            this.detailLoading = false;
        }
    }

    async setDetailPage(page: number): Promise<void> {
        if (page < 1 || page > this.detailTotalPages || page === this.detailPage) return;
        this.detailPage = page;
        await this.loadDetailPage();
    }

    getDetailColumns(): string[] {
        if (this.detailItems.length === 0) return [];
        const first = this.detailItems[0];
        // Eğer item primitive (string, number) ise sütun yok — tek kolon olarak gösterilir
        if (typeof first !== 'object' || first === null) return [];
        return Object.keys(first).filter(k => k !== '$id' && k !== '$values');
    }

    getDetailTitle(): string {
        return this.activeDetail === 'missing-db' ? 'DB\'de Eksik Ürünler' : 'Resim İşlenmemiş Ürünler';
    }

    getDetailIcon(): string {
        return this.activeDetail === 'missing-db' ? 'fa-solid fa-database' : 'fa-solid fa-image';
    }

    getDetailVisiblePages(): number[] {
        const pages: number[] = [];
        const start = Math.max(1, this.detailPage - 2);
        const end = Math.min(this.detailTotalPages, this.detailPage + 2);
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    // ────── Yardımcı ──────
    getSyncRatioClass(): string {
        if (!this.health) return '';
        const ratio = this.health.syncRatioPercent;
        if (ratio >= 90) return 'ratio-excellent';
        if (ratio >= 70) return 'ratio-good';
        if (ratio >= 40) return 'ratio-warning';
        return 'ratio-danger';
    }

    getSyncRatioIcon(): string {
        if (!this.health) return 'fa-solid fa-circle-question';
        const ratio = this.health.syncRatioPercent;
        if (ratio >= 90) return 'fa-solid fa-circle-check';
        if (ratio >= 70) return 'fa-solid fa-circle-half-stroke';
        if (ratio >= 40) return 'fa-solid fa-triangle-exclamation';
        return 'fa-solid fa-circle-xmark';
    }

    formatTime(date: Date | null): string {
        if (!date) return '—';
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageSearchService } from '@/app/core/services/image-search.service';
import {
    ImageSearchByUrlRequest,
    BatchIndexRequest,
    SyncFeedRequest,
    ImageSearchResult,
    ImageSearchResponse,
    ImageSearchStatus,
} from '@/app/core/models/image-search/image-search.models';

@Component({
    selector: 'app-image-search-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './image-search.html',
})
export class ImageSearchPage implements OnInit {
    // Status
    status: ImageSearchStatus | null = null;
    statusLoading = false;
    statusError = '';

    // Search results datatable
    searchResults: ImageSearchResult[] = [];
    filterText = '';
    filteredItems: ImageSearchResult[] = [];
    pagedItems: ImageSearchResult[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
    searchLoading = false;
    totalFound = 0;
    searchDurationMs = 0;

    // Search by file
    selectedFile: File | null = null;
    searchTopK = 10;
    searchMinSimilarity = 0.7;

    // Search by URL
    searchImageUrl = '';
    searchUrlTopK = 10;
    searchUrlMinSimilarity = 0.7;

    // Index single product
    indexProductId = '';
    indexLoading = false;

    // Batch index
    batchProductIds = '';
    batchLoading = false;

    // Index all pending
    pendingBatchSize = 50;
    pendingLoading = false;

    // Remove index
    removeProductId = '';
    removeLoading = false;

    // Sync feed
    syncFeedUrl = '';
    syncIntegrationId = '';
    syncLoading = false;

    // Sync and index
    syncIndexFeedUrl = '';
    syncIndexIntegrationId = '';
    syncIndexLoading = false;

    // Setup collection
    setupLoading = false;

    // Operation result messages
    operationMessage = '';
    operationSuccess = true;

    constructor(private imageSearchService: ImageSearchService) {}

    ngOnInit(): void {
        this.loadStatus();
    }

    // ── Status ──
    async loadStatus(): Promise<void> {
        this.statusLoading = true;
        this.statusError = '';
        try {
            const response = await this.imageSearchService.getStatus();
            this.status = response;
        } catch (err: any) {
            console.error('Status error:', err);
            this.statusError = 'Durum bilgisi alınamadı.';
        } finally {
            this.statusLoading = false;
        }
    }

    // ── Search by File ──
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.selectedFile = input.files[0];
        }
    }

    async searchByFile(): Promise<void> {
        if (!this.selectedFile) return;
        this.searchLoading = true;
        this.operationMessage = '';
        try {
            const response = await this.imageSearchService.searchByImage(
                this.selectedFile,
                this.searchTopK,
                this.searchMinSimilarity
            );
            this.processSearchResponse(response);
            this.showSuccess(`${this.totalFound} sonuç bulundu (${this.searchDurationMs.toFixed(0)}ms).`);
        } catch (err: any) {
            console.error('Search by file error:', err);
            this.showError('Görsel arama başarısız oldu.');
        } finally {
            this.searchLoading = false;
        }
    }

    // ── Search by URL ──
    async searchByUrl(): Promise<void> {
        if (!this.searchImageUrl) return;
        this.searchLoading = true;
        this.operationMessage = '';
        try {
            const request: ImageSearchByUrlRequest = {
                imageUrl: this.searchImageUrl,
                topK: this.searchUrlTopK,
                minSimilarity: this.searchUrlMinSimilarity,
            };
            const response = await this.imageSearchService.searchByUrl(request);
            this.processSearchResponse(response);
            this.showSuccess(`${this.totalFound} sonuç bulundu (${this.searchDurationMs.toFixed(0)}ms).`);
        } catch (err: any) {
            console.error('Search by URL error:', err);
            this.showError('URL ile arama başarısız oldu.');
        } finally {
            this.searchLoading = false;
        }
    }

    // ── Index Single Product ──
    async indexSingleProduct(): Promise<void> {
        if (!this.indexProductId.trim()) return;
        this.indexLoading = true;
        this.operationMessage = '';
        try {
            await this.imageSearchService.indexProduct(this.indexProductId.trim());
            this.showSuccess('Ürün başarıyla indekslendi.');
            this.indexProductId = '';
            await this.loadStatus();
        } catch (err: any) {
            console.error('Index error:', err);
            this.showError('Ürün indeksleme başarısız oldu.');
        } finally {
            this.indexLoading = false;
        }
    }

    // ── Batch Index ──
    async indexBatch(): Promise<void> {
        const ids = this.batchProductIds
            .split('\n')
            .map(id => id.trim())
            .filter(id => id.length > 0);
        if (ids.length === 0) return;
        this.batchLoading = true;
        this.operationMessage = '';
        try {
            const request: BatchIndexRequest = { productIds: ids };
            await this.imageSearchService.indexBatch(request);
            this.showSuccess(`${ids.length} ürün toplu indeksleme için gönderildi.`);
            this.batchProductIds = '';
            await this.loadStatus();
        } catch (err: any) {
            console.error('Batch index error:', err);
            this.showError('Toplu indeksleme başarısız oldu.');
        } finally {
            this.batchLoading = false;
        }
    }

    // ── Index All Pending ──
    async indexAllPending(): Promise<void> {
        this.pendingLoading = true;
        this.operationMessage = '';
        try {
            await this.imageSearchService.indexAllPending(this.pendingBatchSize);
            this.showSuccess('Bekleyen ürünlerin indekslemesi başlatıldı.');
            await this.loadStatus();
        } catch (err: any) {
            console.error('Index all pending error:', err);
            this.showError('Bekleyen indeksleme başarısız oldu.');
        } finally {
            this.pendingLoading = false;
        }
    }

    // ── Remove Index ──
    async removeIndex(): Promise<void> {
        if (!this.removeProductId.trim()) return;
        if (!confirm('Bu ürünün indeksini kaldırmak istediğinize emin misiniz?')) return;
        this.removeLoading = true;
        this.operationMessage = '';
        try {
            await this.imageSearchService.removeIndex(this.removeProductId.trim());
            this.showSuccess('Ürün indeksi başarıyla kaldırıldı.');
            this.removeProductId = '';
            await this.loadStatus();
        } catch (err: any) {
            console.error('Remove index error:', err);
            this.showError('İndeks kaldırma başarısız oldu.');
        } finally {
            this.removeLoading = false;
        }
    }

    // ── Sync Feed ──
    async syncFeed(): Promise<void> {
        if (!this.syncFeedUrl.trim()) return;
        this.syncLoading = true;
        this.operationMessage = '';
        try {
            const request: SyncFeedRequest = {
                feedUrl: this.syncFeedUrl.trim(),
                integrationId: this.syncIntegrationId.trim() || undefined,
            };
            await this.imageSearchService.syncFeed(request);
            this.showSuccess('Feed senkronizasyonu başarıyla başlatıldı.');
            await this.loadStatus();
        } catch (err: any) {
            console.error('Sync feed error:', err);
            this.showError('Feed senkronizasyonu başarısız oldu.');
        } finally {
            this.syncLoading = false;
        }
    }

    // ── Sync & Index ──
    async syncAndIndex(): Promise<void> {
        if (!this.syncIndexFeedUrl.trim()) return;
        this.syncIndexLoading = true;
        this.operationMessage = '';
        try {
            const request: SyncFeedRequest = {
                feedUrl: this.syncIndexFeedUrl.trim(),
                integrationId: this.syncIndexIntegrationId.trim() || undefined,
            };
            await this.imageSearchService.syncAndIndex(request);
            this.showSuccess('Senkronizasyon ve indeksleme başarıyla başlatıldı.');
            await this.loadStatus();
        } catch (err: any) {
            console.error('Sync & index error:', err);
            this.showError('Senkronizasyon ve indeksleme başarısız oldu.');
        } finally {
            this.syncIndexLoading = false;
        }
    }

    // ── Setup Collection ──
    async setupCollection(): Promise<void> {
        if (!confirm('Koleksiyon kurulumunu başlatmak istediğinize emin misiniz?')) return;
        this.setupLoading = true;
        this.operationMessage = '';
        try {
            await this.imageSearchService.setupCollection();
            this.showSuccess('Koleksiyon başarıyla kuruldu.');
            await this.loadStatus();
        } catch (err: any) {
            console.error('Setup collection error:', err);
            this.showError('Koleksiyon kurulumu başarısız oldu.');
        } finally {
            this.setupLoading = false;
        }
    }

    // ── Datatable helpers ──
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
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.searchResults.filter(
            r =>
                (r.name || '').toLowerCase().includes(q) ||
                (r.productCode || '').toLowerCase().includes(q) ||
                (r.brand || '').toLowerCase().includes(q) ||
                (r.productId || '').toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    private processSearchResponse(response: any): void {
        const data = response?.data;
        this.totalFound = data?.totalFound || 0;
        this.searchDurationMs = data?.searchDurationMs || 0;
        this.searchResults = this.extractArray(data);
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.results) return Array.isArray(response.results) ? response.results : [response.results];
        if (response?.data?.results) return Array.isArray(response.data.results) ? response.data.results : [response.data.results];
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    private showSuccess(msg: string): void {
        this.operationMessage = msg;
        this.operationSuccess = true;
    }

    private showError(msg: string): void {
        this.operationMessage = msg;
        this.operationSuccess = false;
    }
}

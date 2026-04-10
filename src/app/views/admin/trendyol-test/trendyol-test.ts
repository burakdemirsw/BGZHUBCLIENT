import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrendyolService } from '@/app/core/services/trendyol.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    TrendyolQuestionDto,
    TrendyolQuestionsFilterRequest,
    TrendyolQuestionStatus,
    TrendyolOrderByField,
    TrendyolOrderByDirection,
    TrendyolAnswerQuestionRequest,
    TrendyolSyncQuestionsRequest,
    TrendyolProductDto,
    TrendyolFilterProductsRequest,
    TrendyolShipmentPackageDto,
    TrendyolShipmentPackagesFilterRequest,
    TrendyolOrderStatus
} from '@/app/core/models/trendyol/trendyol.models';

@Component({
    selector: 'app-trendyol-test',
    imports: [CommonModule, FormsModule],
    templateUrl: './trendyol-test.html',
    styleUrls: ['./trendyol-test.scss']
})
export class TrendyolTestPage implements OnInit {
    loading = false;
    testResult = '';
    testSuccess = false;

    // IntegrationUserId girişi
    integrationUserId = '';

    // Sorular datatable
    questions: TrendyolQuestionDto[] = [];
    filteredQuestions: TrendyolQuestionDto[] = [];
    pagedQuestions: TrendyolQuestionDto[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];
    filterText = '';

    // Filtreler
    barcodeFilter = '';
    startDateFilter = '';
    endDateFilter = '';
    statusFilter: TrendyolQuestionStatus | null = null;
    orderByField: TrendyolOrderByField | null = null;
    orderByDirection: TrendyolOrderByDirection | null = null;

    // Enum'lar dropdown için
    questionStatuses = Object.values(TrendyolQuestionStatus);
    orderByFields = Object.values(TrendyolOrderByField);
    orderByDirections = Object.values(TrendyolOrderByDirection);

    // Cevaplama modal
    showAnswerModal = false;
    selectedQuestion: TrendyolQuestionDto | null = null;
    answerText = '';

    // Senkronizasyon
    syncResult = '';

    // Products datatable
    products: TrendyolProductDto[] = [];
    filteredProducts: TrendyolProductDto[] = [];
    pagedProducts: TrendyolProductDto[] = [];
    productsCurrentPage = 1;
    productsPageSize = 10;
    productsTotalPages = 1;
    productsTotalPagesArray: number[] = [];
    productsFilterText = '';

    // Orders datatable
    orders: TrendyolShipmentPackageDto[] = [];
    filteredOrders: TrendyolShipmentPackageDto[] = [];
    pagedOrders: TrendyolShipmentPackageDto[] = [];
    ordersCurrentPage = 1;
    ordersPageSize = 10;
    ordersTotalPages = 1;
    ordersTotalPagesArray: number[] = [];
    ordersFilterText = '';
    orderStatusFilter: TrendyolOrderStatus | null = null;
    orderStatuses = Object.values(TrendyolOrderStatus);

    constructor(
        private trendyolService: TrendyolService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        // Varsayılan companyId al
        const companyId = this.authStateService.profile?.companyId || '';
        if (companyId) {
            this.loadDefaultIntegrationUserId();
        }

        // Default tarih aralığı: son 1 ay
        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        
        this.endDateFilter = now.toISOString().substring(0, 16);
        this.startDateFilter = oneMonthAgo.toISOString().substring(0, 16);
    }

    async loadDefaultIntegrationUserId(): Promise<void> {
        // İlk integration user id'yi almak için bir servis çağrısı yapılabilir
        // Şimdilik kullanıcı manuel girecek
    }

    // ══════════════════════════════════════
    //  TEST CONNECTION
    // ══════════════════════════════════════

    async testConnection(): Promise<void> {
        if (!this.integrationUserId) {
            this.testResult = 'Lütfen Integration User ID girin.';
            this.testSuccess = false;
            return;
        }

        const companyId = this.authStateService.profile?.companyId || '';
        if (!companyId) {
            this.testResult = 'CompanyId bulunamadı.';
            this.testSuccess = false;
            return;
        }

        this.loading = true;
        this.testResult = '';
        try {
            const response = await this.trendyolService.testConnection(this.integrationUserId, companyId);
            if (response.data) {
                this.testResult = 'Trendyol bağlantısı başarılı! ✓';
                this.testSuccess = true;
            } else {
                this.testResult = 'Trendyol bağlantısı başarısız.';
                this.testSuccess = false;
            }
        } catch (err: any) {
            this.testResult = `Hata: ${err.message || 'Bağlantı testi başarısız.'}`;
            this.testSuccess = false;
        } finally {
            this.loading = false;
        }
    }

    // ══════════════════════════════════════
    //  QUESTIONS DATATABLE
    // ══════════════════════════════════════

    async loadQuestions(): Promise<void> {
        if (!this.integrationUserId) {
            alert('Lütfen Integration User ID girin.');
            return;
        }

        const companyId = this.authStateService.profile?.companyId || '';
        if (!companyId) {
            alert('CompanyId bulunamadı.');
            return;
        }

        this.loading = true;
        try {
            const request: TrendyolQuestionsFilterRequest = {
                integrationUserId: this.integrationUserId,
                companyId: companyId,
                page: 0,
                size: 50
            };

            // Opsiyonel alanları sadece değer varsa ekle
            if (this.barcodeFilter) request.barcode = this.barcodeFilter;
            if (this.startDateFilter) request.startDate = new Date(this.startDateFilter).toISOString();
            if (this.endDateFilter) request.endDate = new Date(this.endDateFilter).toISOString();
            if (this.statusFilter) request.status = this.statusFilter;
            if (this.orderByField) request.orderByField = this.orderByField;
            if (this.orderByDirection) request.orderByDirection = this.orderByDirection;

            const response = await this.trendyolService.getQuestions(request);
            this.questions = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err: any) {
            console.error('Sorular yüklenemedi:', err);
            alert('Sorular yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            this.loading = false;
        }
    }

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
        this.filteredQuestions = this.questions.filter(q =>
            (q.text || '').toLowerCase().includes(filter) ||
            (q.userName || '').toLowerCase().includes(filter) ||
            (q.productName || '').toLowerCase().includes(filter)
        );

        this.totalPages = Math.max(1, Math.ceil(this.filteredQuestions.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedQuestions = this.filteredQuestions.slice(start, end);
    }

    private extractArray(response: any): TrendyolQuestionDto[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) {
            if (response.data.content) return response.data.content;
            if (Array.isArray(response.data)) return response.data;
            return [response.data];
        }
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        if (response?.content) return response.content;
        return [];
    }

    // ══════════════════════════════════════
    //  ANSWER QUESTION
    // ══════════════════════════════════════

    openAnswerModal(question: TrendyolQuestionDto): void {
        this.selectedQuestion = question;
        this.answerText = '';
        this.showAnswerModal = true;
    }

    closeAnswerModal(): void {
        this.showAnswerModal = false;
        this.selectedQuestion = null;
        this.answerText = '';
    }

    async submitAnswer(): Promise<void> {
        if (!this.selectedQuestion || !this.answerText.trim()) {
            alert('Lütfen cevap metni girin.');
            return;
        }

        if (this.answerText.length < 10 || this.answerText.length > 2000) {
            alert('Cevap metni 10-2000 karakter arasında olmalıdır.');
            return;
        }

        const companyId = this.authStateService.profile?.companyId || '';
        if (!companyId) {
            alert('CompanyId bulunamadı.');
            return;
        }

        this.loading = true;
        try {
            const request: TrendyolAnswerQuestionRequest = {
                integrationUserId: this.integrationUserId,
                companyId: companyId,
                questionId: this.selectedQuestion.id,
                text: this.answerText.trim()
            };

            await this.trendyolService.answerQuestion(request);
            alert('Soru başarıyla cevaplandı!');
            this.closeAnswerModal();
            await this.loadQuestions();
        } catch (err: any) {
            console.error('Cevap gönderilemedi:', err);
            alert('Cevap gönderilemedi: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            this.loading = false;
        }
    }

    // ══════════════════════════════════════
    //  SYNC QUESTIONS
    // ══════════════════════════════════════

    async syncQuestions(): Promise<void> {
        if (!this.integrationUserId) {
            alert('Lütfen Integration User ID girin.');
            return;
        }

        const companyId = this.authStateService.profile?.companyId || '';
        if (!companyId) {
            alert('CompanyId bulunamadı.');
            return;
        }

        const userId = this.authStateService.profile?.userId || '';
        if (!userId) {
            alert('UserId bulunamadı.');
            return;
        }

        this.loading = true;
        this.syncResult = '';
        try {
            const request: TrendyolSyncQuestionsRequest = {
                integrationUserId: this.integrationUserId,
                companyId: companyId,
                userId: userId,
                page: 0,
                size: 50
            };

            const response = await this.trendyolService.syncQuestions(request);
            if (response.data) {
                this.syncResult = `
Senkronizasyon Tamamlandı:
- Toplam Soru: ${response.data.totalQuestionsFetched}
- Yeni Müşteri: ${response.data.newCustomersCreated}
- Yeni Konuşma: ${response.data.newConversationsCreated}
- Yeni Mesaj: ${response.data.newMessagesCreated}
- Zaten Var (Atlandı): ${response.data.skippedAlreadyExists}
                `;
            }
        } catch (err: any) {
            console.error('Senkronizasyon hatası:', err);
            this.syncResult = `Hata: ${err.message || 'Senkronizasyon başarısız.'}`;
        } finally {
            this.loading = false;
        }
    }

    // ══════════════════════════════════════
    //  PRODUCTS
    // ══════════════════════════════════════

    async loadProducts(): Promise<void> {
        if (!this.integrationUserId) {
            alert('Lütfen Integration User ID girin.');
            return;
        }

        const companyId = this.authStateService.profile?.companyId || '';
        if (!companyId) {
            alert('CompanyId bulunamadı.');
            return;
        }

        this.loading = true;
        try {
            const request: TrendyolFilterProductsRequest = {
                integrationUserId: this.integrationUserId,
                companyId: companyId,
                page: 0,
                size: 50
            };

            const response = await this.trendyolService.getProducts(request);
            this.products = this.extractProductArray(response);
            this.applyProductsFilterAndPaging();
        } catch (err: any) {
            console.error('Ürünler yüklenemedi:', err);
            alert('Ürünler yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            this.loading = false;
        }
    }

    onProductsFilterChange(): void {
        this.productsCurrentPage = 1;
        this.applyProductsFilterAndPaging();
    }

    applyProductsFilterAndPaging(): void {
        const filter = (this.productsFilterText || '').toLowerCase();
        this.filteredProducts = this.products.filter(p =>
            (p.title || '').toLowerCase().includes(filter) ||
            (p.barcode || '').toLowerCase().includes(filter) ||
            (p.stockCode || '').toLowerCase().includes(filter)
        );

        this.productsTotalPages = Math.max(1, Math.ceil(this.filteredProducts.length / this.productsPageSize));
        this.productsTotalPagesArray = Array.from({ length: this.productsTotalPages }, (_, i) => i + 1);
        const start = (this.productsCurrentPage - 1) * this.productsPageSize;
        const end = start + this.productsPageSize;
        this.pagedProducts = this.filteredProducts.slice(start, end);
    }

    setProductsPage(page: number): void {
        if (page >= 1 && page <= this.productsTotalPages) {
            this.productsCurrentPage = page;
            this.applyProductsFilterAndPaging();
        }
    }

    private extractProductArray(response: any): TrendyolProductDto[] {
        if (response?.data?.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
        if (response?.data && Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    }

    // ══════════════════════════════════════
    //  ORDERS
    // ══════════════════════════════════════

    async loadOrders(): Promise<void> {
        if (!this.integrationUserId) {
            alert('Lütfen Integration User ID girin.');
            return;
        }

        const companyId = this.authStateService.profile?.companyId || '';
        if (!companyId) {
            alert('CompanyId bulunamadı.');
            return;
        }

        this.loading = true;
        try {
            const request: TrendyolShipmentPackagesFilterRequest = {
                integrationUserId: this.integrationUserId,
                companyId: companyId,
                page: 0,
                size: 50
            };

            if (this.orderStatusFilter) {
                request.status = this.orderStatusFilter;
            }

            const response = await this.trendyolService.getOrders(request);
            this.orders = this.extractOrderArray(response);
            this.applyOrdersFilterAndPaging();
        } catch (err: any) {
            console.error('Siparişler yüklenemedi:', err);
            alert('Siparişler yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
        } finally {
            this.loading = false;
        }
    }

    onOrdersFilterChange(): void {
        this.ordersCurrentPage = 1;
        this.applyOrdersFilterAndPaging();
    }

    applyOrdersFilterAndPaging(): void {
        const filter = (this.ordersFilterText || '').toLowerCase();
        this.filteredOrders = this.orders.filter(o =>
            (o.orderNumber || '').toLowerCase().includes(filter) ||
            (o.shipmentNumber || '').toLowerCase().includes(filter) ||
            (o.customerFirstName || '').toLowerCase().includes(filter) ||
            (o.customerLastName || '').toLowerCase().includes(filter)
        );

        this.ordersTotalPages = Math.max(1, Math.ceil(this.filteredOrders.length / this.ordersPageSize));
        this.ordersTotalPagesArray = Array.from({ length: this.ordersTotalPages }, (_, i) => i + 1);
        const start = (this.ordersCurrentPage - 1) * this.ordersPageSize;
        const end = start + this.ordersPageSize;
        this.pagedOrders = this.filteredOrders.slice(start, end);
    }

    setOrdersPage(page: number): void {
        if (page >= 1 && page <= this.ordersTotalPages) {
            this.ordersCurrentPage = page;
            this.applyOrdersFilterAndPaging();
        }
    }

    private extractOrderArray(response: any): TrendyolShipmentPackageDto[] {
        if (response?.data?.content && Array.isArray(response.data.content)) {
            return response.data.content;
        }
        if (response?.data && Array.isArray(response.data)) {
            return response.data;
        }
        return [];
    }

    // ══════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════

    formatDate(timestamp: number): string {
        if (!timestamp) return '-';
        return new Date(timestamp).toLocaleString('tr-TR');
    }

    getStatusBadgeClass(status: string | null): string {
        if (!status) return 'bg-secondary-subtle text-secondary';
        switch (status) {
            case 'WAITING_FOR_ANSWER':
                return 'bg-warning-subtle text-warning';
            case 'ANSWERED':
                return 'bg-success-subtle text-success';
            case 'REJECTED':
                return 'bg-danger-subtle text-danger';
            case 'REPORTED':
                return 'bg-info-subtle text-info';
            default:
                return 'bg-secondary-subtle text-secondary';
        }
    }
}

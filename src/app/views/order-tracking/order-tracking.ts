import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    CargoCompanyOption,
    CreateReturnItemRequest,
    CreateReturnRequest,
    CreateReturnResponse,
    OrderTrackingContext,
    OrderTrackingDetailResponse,
    OrderTrackingProduct,
    OrderTrackingSummaryResponse,
    ReturnOptionsResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';
import { OrderTrackingService } from '@/app/core/services/order-tracking.service';
import {
    MOCK_ORDER_NO,
    MOCK_RETURN_OPTIONS,
    MOCK_VERIFICATION_CODE,
    buildMockOrder,
    buildMockReturnResult,
    buildMockSearchResults,
} from './order-tracking.mock';

/**
 * Backend hazır olana kadar tüm istekler test verisiyle karşılanır.
 * API bağlandığında false yapılır; o zaman URL'de parametre varsa gerçek servis,
 * parametre yoksa yine test verisi kullanılır.
 */
const FORCE_MOCK = true;

/** Mock modda ağ gecikmesini taklit etme süresi */
const MOCK_DELAY_MS = 450;

/** Doğrulama kodunun yeniden gönderilebilmesi için beklenecek saniye */
const RESEND_SECONDS = 120;

const CODE_LENGTH = 6;

type PanelStep = 'search' | 'verify' | 'detail' | 'return' | 'result';

/** Doğrulama adımının alt durumu */
type VerifyPhase = 'idle' | 'code-sent';

/** Kullanıcının bir ürün için yaptığı iade seçimi */
interface ReturnSelection {
    quantity: number;
    reasonId: string;
}

/**
 * Sipariş Detay & İade İşlemleri paneli (public, guard yok).
 * Route: /order-tracking/:companyId/:extensionId/:orderNo — parametreler boşsa test verisiyle çalışır.
 * Akış: sipariş sorgulama → SMS doğrulama → sipariş detayı → iade talebi (3 adım) → iade kargo kodu.
 */
@Component({
    selector: 'app-order-tracking',
    imports: [FormsModule, DatePipe, DecimalPipe],
    templateUrl: './order-tracking.html',
    styleUrls: ['./order-tracking.scss'],
})
export class OrderTrackingPage implements OnInit, OnDestroy {
    readonly stepLabels: { key: PanelStep; label: string }[] = [
        { key: 'search', label: 'Sorgulama' },
        { key: 'verify', label: 'Doğrulama' },
        { key: 'detail', label: 'Sipariş Detayı' },
        { key: 'return', label: 'İade Talebi' },
        { key: 'result', label: 'İade Kodu' },
    ];

    /** Test modunda sorgulanabilecek örnek sipariş kodu */
    readonly demoOrderNo = MOCK_ORDER_NO;

    context: OrderTrackingContext = { companyId: '', extensionId: '', orderNo: '' };
    /** URL'de parametre yoksa true — test verileriyle çalışılır */
    isDemo = false;

    step: PanelStep = 'search';

    // ── Sorgulama ──
    /** Sipariş kodu */
    searchQuery = '';
    searching = false;
    searchError = '';
    searchResults: OrderTrackingSummaryResponse[] = [];
    hasSearched = false;
    /** Sorgu sonucundan seçilen sipariş */
    selectedSummary: OrderTrackingSummaryResponse | null = null;
    /** Doğrulama sonrası doğrudan iade akışına geçilecek mi? */
    private returnAfterVerify = false;

    // ── Doğrulama ──
    verifyPhase: VerifyPhase = 'idle';
    verificationCode = '';
    maskedPhone = '';
    sendingCode = false;
    verifying = false;
    verifyError = '';
    resendCountdown = 0;
    private countdownTimer: ReturnType<typeof setInterval> | null = null;

    // ── Sipariş detayı ──
    order: OrderTrackingDetailResponse | null = null;

    // ── İade talebi ──
    options: ReturnOptionsResponse | null = null;
    loadingOptions = false;
    showDisclaimerModal = false;
    /** Aktif iade adımı: 1 ürün seçimi, 2 talep tipi, 3 kargo şirketi */
    returnStep = 1;
    selections: Record<string, ReturnSelection> = {};
    selectedResolutionId = '';
    selectedCargoCompanyId = '';
    returnNote = '';
    submittingReturn = false;
    returnError = '';

    // ── Sonuç ──
    returnResult: CreateReturnResponse | null = null;
    showResultModal = false;

    constructor(private route: ActivatedRoute, private service: OrderTrackingService) {}

    ngOnInit(): void {
        const params = this.route.snapshot.paramMap;
        this.context = {
            companyId: params.get('companyId') ?? '',
            extensionId: params.get('extensionId') ?? '',
            orderNo: params.get('orderNo') ?? '',
        };
        this.isDemo = !this.context.companyId || !this.context.extensionId;
        // URL'de sipariş numarası varsa sorgu alanı doldurulur ve otomatik sorgulanır
        if (this.context.orderNo) {
            this.searchQuery = this.context.orderNo;
            void this.search();
        }
    }

    ngOnDestroy(): void {
        this.clearCountdown();
    }

    // ────────────────────────── Adım 1: Sorgulama ──────────────────────────

    /** Sipariş koduyla siparişi sorgular */
    async search(): Promise<void> {
        const query = this.searchQuery.trim();
        if (this.searching) return;
        if (!query) {
            this.searchError = 'Lütfen sipariş kodunuzu girin.';
            return;
        }
        this.searching = true;
        this.searchError = '';
        try {
            if (this.useMock) {
                await this.delay();
                this.searchResults = buildMockSearchResults(query);
            } else {
                const response = await this.service.search({
                    companyId: this.context.companyId,
                    extensionId: this.context.extensionId,
                    orderNo: query,
                });
                if (!response.isSuccess) {
                    this.searchError = response.innerError || 'Sorgulama yapılamadı. Lütfen tekrar deneyin.';
                    this.searchResults = [];
                    return;
                }
                this.searchResults = response.data ?? [];
            }
            this.hasSearched = true;
            if (!this.searchResults.length) {
                this.searchError = 'Girdiğiniz sipariş koduna ait kayıt bulunamadı. Lütfen kontrol edip tekrar deneyin.';
            }
        } catch {
            this.searchError = 'Sorgulama yapılamadı. Lütfen tekrar deneyin.';
            this.searchResults = [];
        } finally {
            this.searching = false;
        }
    }

    /** Sorgu alanını ve sonuçları temizler */
    clearSearch(): void {
        this.searchQuery = '';
        this.searchResults = [];
        this.hasSearched = false;
        this.searchError = '';
    }

    /**
     * Sonuç tablosundan bir sipariş seçilir; devam etmek için SMS doğrulaması gerekir.
     * startReturn true ise doğrulama sonrası doğrudan iade akışı açılır.
     */
    selectOrder(summary: OrderTrackingSummaryResponse, startReturn: boolean): void {
        if (startReturn && !summary.canCreateReturn) return;
        this.selectedSummary = summary;
        this.returnAfterVerify = startReturn;
        this.context = { ...this.context, orderNo: summary.orderNo };
        this.order = null;
        this.options = null;
        this.verifyPhase = 'idle';
        this.verificationCode = '';
        this.verifyError = '';
        this.clearCountdown();
        this.step = 'verify';
    }

    /** Doğrulama adımından sorgulama ekranına döner */
    backToSearch(): void {
        this.clearCountdown();
        this.selectedSummary = null;
        this.returnAfterVerify = false;
        this.verifyPhase = 'idle';
        this.verificationCode = '';
        this.verifyError = '';
        this.step = 'search';
    }

    // ────────────────────────── Adım 2: Doğrulama ──────────────────────────

    /** "Doğrulama Kodunu Gönder" — siparişin sahibine SMS gönderir */
    async sendCode(): Promise<void> {
        if (this.sendingCode || this.resendCountdown > 0) return;
        this.sendingCode = true;
        this.verifyError = '';
        try {
            if (this.useMock) {
                await this.delay();
                this.maskedPhone = buildMockOrder(this.context.orderNo).maskedPhone;
                this.startCountdown(RESEND_SECONDS);
            } else {
                const response = await this.service.sendVerificationCode(this.context);
                if (!response.isSuccess || !response.data) {
                    this.verifyError = response.innerError || 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.';
                    return;
                }
                this.maskedPhone = response.data.maskedPhone;
                this.startCountdown(response.data.resendAfterSeconds || RESEND_SECONDS);
            }
            this.verifyPhase = 'code-sent';
            this.verificationCode = '';
        } catch {
            this.verifyError = 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.';
        } finally {
            this.sendingCode = false;
        }
    }

    /** Girilen kodu doğrular, başarılıysa sipariş detayına geçer */
    async verifyCode(): Promise<void> {
        if (this.verifying || !this.isCodeComplete) return;
        this.verifying = true;
        this.verifyError = '';
        try {
            if (this.useMock) {
                await this.delay();
                if (this.verificationCode !== MOCK_VERIFICATION_CODE) {
                    this.verifyError = 'Doğrulama kodu hatalı. (Test kodu: ' + MOCK_VERIFICATION_CODE + ')';
                    return;
                }
                this.order = buildMockOrder(this.context.orderNo);
            } else {
                const response = await this.service.verifyOrder({ ...this.context, code: this.verificationCode });
                if (!response.isSuccess || !response.data) {
                    this.verifyError = response.innerError || 'Doğrulama kodu hatalı ya da süresi dolmuş.';
                    return;
                }
                this.order = response.data.order;
            }
            this.clearCountdown();
            this.step = 'detail';
            // Tablodan "İade Talebi Yap" ile gelindiyse doğrudan iade akışı açılır
            if (this.returnAfterVerify) {
                this.returnAfterVerify = false;
                await this.openReturnFlow();
            }
        } catch {
            this.verifyError = 'Doğrulama sırasında bir hata oluştu. Lütfen tekrar deneyin.';
        } finally {
            this.verifying = false;
        }
    }

    /** Doğrulama kodu alanı sadece rakam kabul eder */
    onCodeInput(value: string): void {
        this.verificationCode = (value || '').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
        this.verifyError = '';
    }

    get isCodeComplete(): boolean {
        return this.verificationCode.length === CODE_LENGTH;
    }

    get resendCountdownText(): string {
        const minutes = Math.floor(this.resendCountdown / 60);
        const seconds = this.resendCountdown % 60;
        return minutes + ':' + seconds.toString().padStart(2, '0');
    }

    private startCountdown(seconds: number): void {
        this.clearCountdown();
        this.resendCountdown = seconds;
        this.countdownTimer = setInterval(() => {
            this.resendCountdown -= 1;
            if (this.resendCountdown <= 0) this.clearCountdown();
        }, 1000);
    }

    private clearCountdown(): void {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        this.resendCountdown = 0;
    }

    // ────────────────────────── Adım 3: Sipariş detayı ──────────────────────────

    /** Detay ekranında "İade İşlemleri" — uyarı modalını açar */
    async openReturnFlow(): Promise<void> {
        if (!this.order?.canCreateReturn) return;
        await this.loadReturnOptions();
        if (!this.options) return;
        this.resetReturnForm();
        this.showDisclaimerModal = true;
        this.step = 'return';
    }

    /** "Okudum, Anladım" — uyarı modalını kapatıp 1. adıma geçer */
    acceptDisclaimers(): void {
        this.showDisclaimerModal = false;
        this.returnStep = 1;
    }

    /** İade akışından sipariş detayına dön */
    backToDetail(): void {
        this.showDisclaimerModal = false;
        this.step = 'detail';
    }

    private resetReturnForm(): void {
        this.selections = {};
        this.selectedResolutionId = '';
        this.selectedCargoCompanyId = '';
        this.returnNote = '';
        this.returnStep = 1;
        this.returnError = '';
    }

    private async loadReturnOptions(): Promise<void> {
        if (this.options || this.loadingOptions) return;
        this.loadingOptions = true;
        this.returnError = '';
        try {
            if (this.useMock) {
                await this.delay();
                this.options = MOCK_RETURN_OPTIONS;
            } else {
                const response = await this.service.getReturnOptions(this.context.companyId, this.context.extensionId);
                if (!response.isSuccess || !response.data) {
                    this.returnError = response.innerError || 'İade seçenekleri yüklenemedi.';
                    return;
                }
                this.options = response.data;
            }
        } catch {
            this.returnError = 'İade seçenekleri yüklenemedi.';
        } finally {
            this.loadingOptions = false;
        }
    }

    // ────────────────────────── Adım 4: İade formu ──────────────────────────

    /** Ürünün seçili iade adedi */
    quantityOf(product: OrderTrackingProduct): number {
        return this.selections[product.id]?.quantity ?? 0;
    }

    reasonOf(product: OrderTrackingProduct): string {
        return this.selections[product.id]?.reasonId ?? '';
    }

    /** Bir üründen kaç adet iade edileceğini belirler */
    onQuantityChange(product: OrderTrackingProduct, value: number | string): void {
        const quantity = Number(value) || 0;
        if (quantity <= 0) {
            delete this.selections[product.id];
        } else {
            this.selections[product.id] = { quantity, reasonId: this.reasonOf(product) };
        }
        this.returnError = '';
    }

    onReasonChange(product: OrderTrackingProduct, reasonId: string): void {
        const current = this.selections[product.id];
        if (!current) return;
        this.selections[product.id] = { ...current, reasonId };
        this.returnError = '';
    }

    /** Adet seçim kutusunun seçenekleri: 0..satın alınan adet */
    quantityOptions(product: OrderTrackingProduct): number[] {
        return Array.from({ length: product.quantity + 1 }, (_, index) => index);
    }

    get selectedProductCount(): number {
        return Object.keys(this.selections).length;
    }

    get selectedTotalQuantity(): number {
        return Object.values(this.selections).reduce((total, item) => total + item.quantity, 0);
    }

    /** Seçili ürünlerin toplam tutarı — tahmini hakediş için bilgi amaçlı */
    get selectedTotalAmount(): number {
        return (this.order?.products ?? []).reduce((total, product) => {
            return total + this.quantityOf(product) * product.unitPrice;
        }, 0);
    }

    /** 1. adım: en az bir ürün seçili ve her seçili ürünün iade nedeni girilmiş olmalı */
    get isStep1Valid(): boolean {
        const values = Object.values(this.selections);
        return values.length > 0 && values.every(item => !!item.reasonId);
    }

    get isStep2Valid(): boolean {
        return !!this.selectedResolutionId;
    }

    get isStep3Valid(): boolean {
        return !!this.selectedCargoCompanyId;
    }

    /** Adımlar sırayla açılır; önceki adım tamamlanmadan sonrakine geçilemez */
    canEnterStep(step: number): boolean {
        if (step <= 1) return true;
        if (step === 2) return this.isStep1Valid;
        return this.isStep1Valid && this.isStep2Valid;
    }

    goToReturnStep(step: number): void {
        if (step > this.returnStep && !this.canEnterStep(step)) return;
        this.returnStep = step;
        this.returnError = '';
    }

    nextReturnStep(): void {
        if (this.returnStep === 1 && !this.isStep1Valid) {
            this.returnError = 'Lütfen en az bir ürün seçin ve seçtiğiniz her ürün için iade nedeni belirtin.';
            return;
        }
        if (this.returnStep === 2 && !this.isStep2Valid) {
            this.returnError = 'Lütfen nasıl bir işlem talep ettiğinizi seçin.';
            return;
        }
        this.goToReturnStep(this.returnStep + 1);
    }

    previousReturnStep(): void {
        if (this.returnStep <= 1) {
            this.backToDetail();
            return;
        }
        this.returnStep -= 1;
        this.returnError = '';
    }

    selectCargoCompany(company: CargoCompanyOption): void {
        this.selectedCargoCompanyId = company.id;
        this.returnError = '';
    }

    /** İade talebini oluşturur ve iade kargo kodunu gösterir */
    async submitReturn(): Promise<void> {
        if (this.submittingReturn) return;
        if (!this.isStep1Valid || !this.isStep2Valid || !this.isStep3Valid) {
            this.returnError = 'Lütfen tüm adımları tamamlayın.';
            return;
        }
        const items: CreateReturnItemRequest[] = Object.entries(this.selections).map(([productId, selection]) => ({
            productId,
            quantity: selection.quantity,
            reasonId: selection.reasonId,
        }));
        const request: CreateReturnRequest = {
            ...this.context,
            items,
            resolutionId: this.selectedResolutionId,
            cargoCompanyId: this.selectedCargoCompanyId,
            note: this.returnNote?.trim() || undefined,
        };

        this.submittingReturn = true;
        this.returnError = '';
        try {
            if (this.useMock) {
                await this.delay();
                this.returnResult = buildMockReturnResult(request);
            } else {
                const response = await this.service.createReturn(request);
                if (!response.isSuccess || !response.data) {
                    this.returnError = response.innerError || 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.';
                    return;
                }
                this.returnResult = response.data;
            }
            this.step = 'result';
            this.showResultModal = true;
        } catch {
            this.returnError = 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.';
        } finally {
            this.submittingReturn = false;
        }
    }

    /** Sonuç modalını kapatıp sipariş detayına döner */
    closeResultModal(): void {
        this.showResultModal = false;
        this.step = 'detail';
        if (this.order) {
            this.order = {
                ...this.order,
                canCreateReturn: false,
                returnDisabledReason: 'Bu sipariş için iade talebi oluşturuldu. Yeni talep oluşturulamaz.',
            };
        }
    }

    /** İade kodunu panoya kopyalar */
    async copyReturnCode(): Promise<void> {
        if (!this.returnResult) return;
        try {
            await navigator.clipboard.writeText(this.returnResult.returnCode);
        } catch {
            /* pano erişimi yoksa sessizce geç */
        }
    }

    // ────────────────────────── Yardımcılar ──────────────────────────

    /** Üst adım göstergesinde bu adım tamamlandı mı? */
    isStepDone(step: PanelStep): boolean {
        const order: PanelStep[] = ['search', 'verify', 'detail', 'return', 'result'];
        return order.indexOf(step) < order.indexOf(this.step);
    }

    isStepActive(step: PanelStep): boolean {
        return this.step === step;
    }

    get brandName(): string {
        return this.order?.brand?.name ?? '';
    }

    get resolutionName(): string {
        return this.options?.resolutions.find(x => x.id === this.selectedResolutionId)?.name ?? '';
    }

    get selectedCargoCompany(): CargoCompanyOption | null {
        return this.options?.cargoCompanies.find(x => x.id === this.selectedCargoCompanyId) ?? null;
    }

    private get useMock(): boolean {
        return FORCE_MOCK || this.isDemo;
    }

    private delay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    }
}

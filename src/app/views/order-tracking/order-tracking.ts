import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    CargoCompanyResponse,
    CreateReturnClaimLineRequest,
    CreateReturnClaimRequest,
    OrderTrackingBrandResponse,
    OrderTrackingContext,
    OrderTrackingDetailResponse,
    OrderTrackingItemResponse,
    OrderTrackingOrderRequest,
    OrderTrackingSummaryResponse,
    ReturnClaimDetailLineResponse,
    ReturnClaimDetailResponse,
    ReturnClaimResultResponse,
    ReturnReasonOptionResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';
import { OrderTrackingService } from '@/app/core/services/order-tracking.service';
import { environment } from '@/environments/environment';
import {
    MOCK_AFTER_RETURN_ACTIONS,
    MOCK_BEFORE_CLAIM_INSTRUCTIONS,
    MOCK_CARGO_COMPANIES,
    MOCK_ORDER_NO,
    MOCK_RETURN_REASONS,
    MOCK_VERIFICATION_CODE,
    buildMockOrderDetail,
    buildMockOrderSummary,
    buildMockReturnClaim,
    buildMockReturnResult,
} from './order-tracking.mock';

/** Demo modda ağ gecikmesini taklit etme süresi */
const MOCK_DELAY_MS = 400;

/**
 * Geliştirme kolaylığı: SMS beklemeden sipariş detayına geçmek için sabit kod.
 * Yalnızca `environment.production` false iken çalışır, production build'de kabul edilmez.
 */
const DEV_BYPASS_CODE = '111111';

/**
 * Aynı sipariş için iki SMS isteği arasında beklenmesi gereken süre (1 dakika).
 * Sayfa yenilense de geçerli olması için son gönderim zamanı tarayıcıda saklanır.
 * Bu yalnızca kullanıcı tarafı koruma — asıl sınır backend'de olmalı.
 */
const MIN_RESEND_SECONDS = 60;

/** Son SMS gönderim zamanının saklandığı anahtarın öneki */
const LAST_CODE_SENT_KEY = 'ot-last-code-sent';

const CODE_LENGTH = 6;

/** OrderTracking uçları tutar için para birimi dönmüyor */
const CURRENCY_CODE = 'TL';

/**
 * API hata kodlarının kullanıcıya gösterilecek karşılıkları.
 *
 * ⚠ Bu sayfa müşteriye açıktır: backend'den gelen hata metinleri (`innerError`,
 * exception mesajı, SQL detayı) ekrana ASLA basılmaz. Kullanıcıya yalnızca
 * buradaki sabit mesajlar ya da ilgili adımın genel mesajı gösterilir;
 * teknik ayrıntı `console.error` ile loglanır.
 */
const ERROR_MESSAGES: Record<string, string> = {
    ORDERTRACK_001: 'Bu sipariş koduna ait kayıt bulunamadı. Lütfen kodu kontrol edip tekrar deneyin.',
    VERIFICATION_006: 'Çok sık kod istediniz. Lütfen bir süre bekleyip tekrar deneyin.',
    WMS_RETURNCLAIM_002: 'Bu sipariş için zaten bir iade talebi var. Yeni talep oluşturulamaz.',
};

type PanelStep = 'search' | 'verify' | 'detail' | 'return' | 'result';

/** Doğrulama adımının alt durumu */
type VerifyPhase = 'idle' | 'code-sent';

/** Kullanıcının bir sipariş satırı için yaptığı iade seçimi */
interface ReturnSelection {
    quantity: number;
    returnCode: string;
}

/**
 * Sipariş Takip & İade paneli (public, guard yok).
 * Route: /order-tracking/:companyId/:extensionId — parametreler boşsa test verisiyle çalışır.
 * Sipariş numarası route'tan gelmez, 1. adımdaki sorgulama ekranında girilir.
 * Uçlar: OrderTracking controller (`/order-tracking/...`, `/api` öneki yok).
 *
 * Akış: sipariş sorgulama → SMS doğrulama → sipariş detayı → iade talebi (3 adım) → iade kodu.
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

    readonly currencyCode = CURRENCY_CODE;
    /** Test modunda sorgulanabilecek örnek sipariş kodu */
    readonly demoOrderNo = MOCK_ORDER_NO;

    context: OrderTrackingContext = { companyId: '', extensionId: '', orderNo: '' };
    /** URL'de şirket/eklenti parametresi yoksa true — test verileriyle çalışılır */
    isDemo = false;

    step: PanelStep = 'search';

    // ── Marka ──
    brand: OrderTrackingBrandResponse | null = null;

    // ── Sorgulama ──
    searchQuery = '';
    searching = false;
    searchError = '';
    /** Sorgu sonucu bulunan sipariş (doğrulama öncesi özet) */
    searchResult: OrderTrackingSummaryResponse | null = null;

    // ── Doğrulama ──
    verifyPhase: VerifyPhase = 'idle';
    verificationCode = '';
    maskedPhone = '';
    sendingCode = false;
    verifying = false;
    verifyError = '';
    resendCountdown = 0;
    /** Doğrulama sonrası doğrudan iade akışına geçilecek mi? */
    private returnAfterVerify = false;
    private countdownTimer: ReturnType<typeof setInterval> | null = null;

    // ── Sipariş detayı ──
    order: OrderTrackingDetailResponse | null = null;
    /** Siparişe daha önce açılmış iade talepleri */
    returnClaims: ReturnClaimDetailResponse[] = [];
    claimsLoading = false;
    /** Detay ekranındaki yenile butonu — istek sürerken ikon döner */
    refreshingOrder = false;
    detailError = '';

    // ── İade talebi ──
    reasons: ReturnReasonOptionResponse[] = [];
    actions: AfterReturnActionOptionResponse[] = [];
    instructions: BeforeClaimInstructionOptionResponse[] = [];
    cargoCompanies: CargoCompanyResponse[] = [];
    optionsLoaded = false;
    loadingOptions = false;
    showDisclaimerModal = false;
    /** Aktif iade adımı: 1 ürün seçimi, 2 talep tipi, 3 kargo şirketi */
    returnStep = 1;
    selections: Record<string, ReturnSelection> = {};
    selectedActionCode = '';
    selectedCargoExtensionId = '';
    returnNote = '';
    /** Para iadesi bilgileri — havale ile ödenen siparişlerde zorunlu */
    returnIban = '';
    returnIbanAccountName = '';
    submittingReturn = false;
    returnError = '';

    // ── Sonuç ──
    returnResult: ReturnClaimResultResponse | null = null;
    showResultModal = false;

    constructor(private route: ActivatedRoute, private service: OrderTrackingService) {}

    ngOnInit(): void {
        const params = this.route.snapshot.paramMap;
        this.context = {
            companyId: params.get('companyId') ?? '',
            extensionId: params.get('extensionId') ?? '',
            orderNo: '',
        };
        this.isDemo = !this.context.companyId || !this.context.extensionId;
        void this.loadBrand();
    }

    ngOnDestroy(): void {
        this.clearCountdown();
    }

    /**
     * Sipariş kırılımıyla çalışan POST uçlarının ortak gövdesi.
     * `companyId` / `extensionId` oturumdan değil, public panelin route
     * parametrelerinden gelir; sipariş no sorgulama ekranında girilir.
     */
    private orderRequest(orderNo: string = this.context.orderNo): OrderTrackingOrderRequest {
        return {
            companyId: this.context.companyId,
            extensionId: this.context.extensionId,
            orderNo,
        };
    }

    // ────────────────────────── Marka ──────────────────────────

    private async loadBrand(): Promise<void> {
        if (this.isDemo) {
            this.brand = { companyId: '', brandName: 'ESRA HELVACI', logoUrl: null, smsExtensionCode: null };
            return;
        }
        try {
            const response = await this.service.getBrand({ companyId: this.context.companyId });
            if (response.isSuccess && response.data) this.brand = response.data;
        } catch {
            /* marka bilgisi zorunlu değil, sessizce geçilir */
        }
    }

    get brandName(): string {
        return this.brand?.brandName ?? '';
    }

    get brandLogoUrl(): string | null {
        return this.brand?.logoUrl ?? null;
    }

    // ────────────────────────── Adım 1: Sorgulama ──────────────────────────

    /** Sipariş koduyla siparişi sorgular */
    async search(): Promise<void> {
        const orderNo = this.searchQuery.trim();
        if (this.searching) return;
        if (!orderNo) {
            this.searchError = 'Lütfen sipariş kodunuzu girin.';
            return;
        }
        this.searching = true;
        this.searchError = '';
        this.searchResult = null;
        try {
            if (this.isDemo) {
                await this.delay();
                this.searchResult = buildMockOrderSummary(orderNo.toUpperCase());
            } else {
                const response = await this.service.getOrderSummary(this.orderRequest(orderNo));
                if (!response.isSuccess || !response.data) {
                    this.searchError = this.messageFromResponse(
                        response,
                        'Girdiğiniz sipariş koduna ait kayıt bulunamadı. Lütfen kontrol edip tekrar deneyin.',
                    );
                    return;
                }
                this.searchResult = response.data;
            }
            this.context = { ...this.context, orderNo: this.searchResult.orderNumber };
        } catch (err) {
            this.searchError = this.messageFrom(err, 'Sorgulama yapılamadı. Lütfen tekrar deneyin.');
        } finally {
            this.searching = false;
        }
    }

    clearSearch(): void {
        this.searchQuery = '';
        this.searchResult = null;
        this.searchError = '';
    }

    /**
     * Sorgu sonucundan devam edilir; sipariş detayı ve iade için SMS doğrulaması gerekir.
     * startReturn true ise doğrulama sonrası doğrudan iade akışı açılır.
     */
    continueWithOrder(startReturn: boolean): void {
        if (!this.searchResult) return;
        if (startReturn && !this.searchResult.canRequestReturn) return;
        this.returnAfterVerify = startReturn;
        this.order = null;
        this.verifyPhase = 'idle';
        this.verificationCode = '';
        this.verifyError = '';
        this.clearCountdown();
        this.applyResendCooldown();
        this.step = 'verify';
    }

    // ────────────────────────── Adım 2: Doğrulama ──────────────────────────

    /** "Doğrulama Kodunu Gönder" — siparişin telefonuna SMS gönderir */
    async sendCode(): Promise<void> {
        if (this.sendingCode || this.resendCountdown > 0) return;
        const waitSeconds = this.remainingCooldownSeconds();
        if (waitSeconds > 0) {
            this.startCountdown(waitSeconds);
            this.verifyError = 'Aynı sipariş için dakikada yalnızca bir doğrulama kodu gönderilebilir.';
            return;
        }
        this.sendingCode = true;
        this.verifyError = '';
        try {
            if (this.isDemo) {
                await this.delay();
                this.maskedPhone = '0(5**) *** ** 34';
                this.markCodeSent();
                this.startCountdown(MIN_RESEND_SECONDS);
            } else {
                const response = await this.service.sendVerificationCode(this.orderRequest());
                if (!response.isSuccess || !response.data) {
                    this.verifyError = this.messageFromResponse(response, 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
                    return;
                }
                this.maskedPhone = response.data.maskedPhone ?? '';
                this.markCodeSent();
                this.startCountdown(MIN_RESEND_SECONDS);
            }
            this.verifyPhase = 'code-sent';
            this.verificationCode = '';
        } catch (err) {
            this.verifyError = this.messageFrom(err, 'Doğrulama kodu gönderilemedi. Lütfen tekrar deneyin.');
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
            if (this.isDevBypassCode) {
                // Geliştirme kodu: doğrulama atlanır, sipariş detayı doğrudan çekilir
                const order = await this.fetchOrderDetail();
                if (!order) {
                    this.verifyError = this.detailFetchError;
                    return;
                }
                this.order = order;
            } else if (this.isDemo) {
                await this.delay();
                if (this.verificationCode !== MOCK_VERIFICATION_CODE) {
                    this.verifyError = 'Doğrulama kodu hatalı. (Test kodu: ' + MOCK_VERIFICATION_CODE + ')';
                    return;
                }
                this.order = buildMockOrderDetail(this.context.orderNo);
            } else {
                const response = await this.service.verify({
                    ...this.orderRequest(),
                    key: this.verificationCode,
                });
                if (!response.isSuccess || !response.data) {
                    this.verifyError = this.messageFromResponse(response, 'Doğrulama kodu hatalı ya da süresi dolmuş.');
                    return;
                }
                this.order = response.data;
            }
            await this.enterOrderDetail();
        } catch (err) {
            this.verifyError = this.messageFrom(err, 'Doğrulama kodu hatalı ya da süresi dolmuş.');
        } finally {
            this.verifying = false;
        }
    }

    /**
     * Gizli geliştirme kısayolu: "Sipariş Doğrulama" başlığına çift tıklanınca
     * SMS doğrulaması atlanır ve sipariş detayı doğrudan açılır.
     * `environment.production` true iken hiçbir şey yapmaz.
     */
    async skipVerificationForDev(): Promise<void> {
        if (environment.production || this.verifying) return;
        this.verifying = true;
        this.verifyError = '';
        try {
            const order = await this.fetchOrderDetail();
            if (!order) {
                this.verifyError = this.detailFetchError;
                return;
            }
            this.order = order;
            await this.enterOrderDetail();
        } catch (err) {
            this.verifyError = this.messageFrom(err, 'Sipariş detayı alınamadı.');
        } finally {
            this.verifying = false;
        }
    }

    /** Sipariş detayını ve iade taleplerini API'den yeniden çeker */
    async reloadOrder(): Promise<void> {
        if (this.refreshingOrder) return;
        this.refreshingOrder = true;
        this.detailError = '';
        try {
            const order = await this.fetchOrderDetail();
            if (!order) {
                this.detailError = this.detailFetchError;
                return;
            }
            this.order = order;
            await this.loadReturnClaims();
        } catch (err) {
            this.detailError = this.messageFrom(err, 'Sipariş bilgileri yenilenemedi.');
        } finally {
            this.refreshingOrder = false;
        }
    }

    /** Doğrulama tamamlandıktan sonra detay adımına geçiş */
    private async enterOrderDetail(): Promise<void> {
        this.detailError = '';
        this.clearCountdown();
        this.step = 'detail';
        await this.loadReturnClaims();
        // Sorgu ekranında "İade Talebi Yap" ile gelindiyse doğrudan iade akışı açılır
        if (this.returnAfterVerify) {
            this.returnAfterVerify = false;
            if (this.canOpenReturnFlow) await this.openReturnFlow();
        }
    }

    /** Doğrulama kodu alanı sadece rakam kabul eder */
    onCodeInput(value: string): void {
        this.verificationCode = (value || '').replace(/[^0-9]/g, '').slice(0, CODE_LENGTH);
        this.verifyError = '';
    }

    /** Geliştirme kodu girildi mi — production build'de her zaman false */
    private get isDevBypassCode(): boolean {
        return !environment.production && this.verificationCode === DEV_BYPASS_CODE;
    }

    /** `fetchOrderDetail` başarısız olduğunda gösterilecek mesaj */
    private detailFetchError = '';

    /** Sipariş detayını çeker — doğrulama atlandığında ve yenilemede kullanılır */
    private async fetchOrderDetail(): Promise<OrderTrackingDetailResponse | null> {
        this.detailFetchError = '';
        if (this.isDemo) {
            await this.delay();
            return buildMockOrderDetail(this.context.orderNo);
        }
        const response = await this.service.getOrderDetail(this.orderRequest());
        if (!response.isSuccess || !response.data) {
            this.detailFetchError = this.messageFromResponse(response, 'Sipariş detayı alınamadı.');
            return null;
        }
        return response.data;
    }

    get isCodeComplete(): boolean {
        return this.verificationCode.length === CODE_LENGTH;
    }

    get resendCountdownText(): string {
        const minutes = Math.floor(this.resendCountdown / 60);
        const seconds = this.resendCountdown % 60;
        return minutes + ':' + seconds.toString().padStart(2, '0');
    }

    /** Doğrulama adımından sorgulama ekranına döner */
    backToSearch(): void {
        this.clearCountdown();
        this.returnAfterVerify = false;
        this.verifyPhase = 'idle';
        this.verificationCode = '';
        this.verifyError = '';
        this.step = 'search';
    }

    /** Sipariş bazlı saklama anahtarı */
    private get cooldownKey(): string {
        return `${LAST_CODE_SENT_KEY}:${this.context.companyId}:${this.context.orderNo}`;
    }

    /** Bu sipariş için yeni kod istenebilmesine kaç saniye kaldı */
    private remainingCooldownSeconds(): number {
        try {
            const lastSent = Number(localStorage.getItem(this.cooldownKey) ?? 0);
            if (!lastSent) return 0;
            const elapsed = Math.floor((Date.now() - lastSent) / 1000);
            return Math.max(0, MIN_RESEND_SECONDS - elapsed);
        } catch {
            // Tarayıcı depolamaya izin vermiyorsa bekleme uygulanmaz
            return 0;
        }
    }

    /** Sayfa yenilense de bekleme süresi korunsun */
    private markCodeSent(): void {
        try {
            localStorage.setItem(this.cooldownKey, String(Date.now()));
        } catch {
            /* depolama yoksa sessizce geç */
        }
    }

    /** Doğrulama adımına girildiğinde önceki gönderimden kalan süreyi işler */
    private applyResendCooldown(): void {
        const waitSeconds = this.remainingCooldownSeconds();
        if (waitSeconds > 0) this.startCountdown(waitSeconds);
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

    get orderTotal(): number {
        return Number(this.order?.totalAmount ?? 0);
    }

    get cargoAmount(): number {
        return Number(this.order?.cargoAmount ?? 0);
    }

    /** "Beden: S · Renk: Kırmızı" biçiminde varyant metni */
    optionsText(item: OrderTrackingItemResponse): string {
        return (item.options ?? []).join(' · ');
    }

    /** Siparişin iade taleplerini çeker */
    private async loadReturnClaims(): Promise<void> {
        this.claimsLoading = true;
        try {
            if (this.isDemo) {
                this.returnClaims = [];
            } else {
                const response = await this.service.getReturnClaimDetails(this.orderRequest());
                this.returnClaims = response.data ?? [];
            }
        } catch (err) {
            // Talep listesi alınamazsa sipariş detayı yine de gösterilir
            console.error('[order-tracking] iade talepleri alınamadı', err);
            this.returnClaims = [];
        } finally {
            this.claimsLoading = false;
        }
    }

    get hasReturnClaim(): boolean {
        return this.returnClaims.length > 0;
    }

    /** Bir sipariş için tek iade talebi açılabilir */
    get canOpenReturnFlow(): boolean {
        return !!this.order?.canRequestReturn && !this.hasReturnClaim && !this.claimsLoading;
    }

    /** İade butonu yerine gösterilecek açıklama */
    get returnDisabledReason(): string {
        if (this.hasReturnClaim) return 'Bu sipariş için zaten bir iade talebi oluşturulmuş. Yeni talep açılamaz.';
        return 'Bu sipariş için iade talebi oluşturulamaz.';
    }

    /** Talep satırındaki ürünün adı */
    claimLineName(line: ReturnClaimDetailLineResponse): string {
        return line.itemName || line.itemCode || 'Ürün';
    }

    /** Talep satırının renk / beden gibi varyant metni */
    claimLineVariant(line: ReturnClaimDetailLineResponse): string {
        return line.colorName || '';
    }

    /**
     * Talep satırı görseli — API satırın kendi görselini döner (`sourceImageUrl`);
     * boşsa sipariş satırlarıyla eşleştirip oradaki görsel kullanılır.
     */
    claimLineImage(line: ReturnClaimDetailLineResponse): string | null {
        return line.sourceImageUrl || this.matchOrderItem(line)?.imageUrl || null;
    }

    /** Talep satırını sipariş satırıyla eşler (satır kimliği → barkod → stok kodu) */
    private matchOrderItem(line: ReturnClaimDetailLineResponse): OrderTrackingItemResponse | null {
        const items = this.order?.items ?? [];
        if (!items.length) return null;
        const sameText = (a: unknown, b: unknown) => !!a && !!b && String(a).toLowerCase() === String(b).toLowerCase();
        return (
            items.find((item) => sameText(item.lineId, line.externalClaimLineId)) ??
            items.find((item) => sameText(item.barcode, line.barcode)) ??
            items.find((item) => sameText(item.stockCode, line.itemCode)) ??
            null
        );
    }

    /** Detay ekranında "İade İşlemleri" — uyarı modalını açar */
    async openReturnFlow(): Promise<void> {
        if (!this.canOpenReturnFlow) return;
        await this.loadReturnOptions();
        if (!this.optionsLoaded) return;
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
        this.selectedActionCode = '';
        this.selectedCargoExtensionId = '';
        this.returnNote = '';
        this.returnIban = '';
        this.returnIbanAccountName = '';
        this.returnStep = 1;
        this.returnError = '';
    }

    /** İade nedenleri, işlem tipleri ve bilgilendirme maddeleri tek seferde çekilir */
    private async loadReturnOptions(): Promise<void> {
        if (this.optionsLoaded || this.loadingOptions) return;
        this.loadingOptions = true;
        this.returnError = '';
        try {
            if (this.isDemo) {
                await this.delay();
                this.reasons = MOCK_RETURN_REASONS;
                this.actions = MOCK_AFTER_RETURN_ACTIONS;
                this.instructions = MOCK_BEFORE_CLAIM_INSTRUCTIONS;
                this.cargoCompanies = MOCK_CARGO_COMPANIES;
            } else {
                const catalogRequest = { companyId: this.context.companyId };
                const [reasons, actions, instructions, cargoCompanies] = await Promise.all([
                    this.service.getReturnReasons(catalogRequest),
                    this.service.getAfterReturnActions(),
                    this.service.getBeforeClaimInstructions(catalogRequest),
                    this.service.getCargoCompanies(catalogRequest),
                ]);
                this.reasons = this.sorted(reasons.data ?? []);
                this.actions = this.sorted(actions.data ?? []);
                this.instructions = this.sorted(instructions.data ?? []);
                this.cargoCompanies = cargoCompanies.data ?? [];
                if (!this.reasons.length) {
                    this.returnError = 'İade nedenleri yüklenemedi. Lütfen daha sonra tekrar deneyin.';
                    return;
                }
            }
            this.optionsLoaded = true;
        } catch (err) {
            this.returnError = this.messageFrom(err, 'İade seçenekleri yüklenemedi.');
        } finally {
            this.loadingOptions = false;
        }
    }

    /** API sıralı dönmeyebilir; listeler sortOrder'a göre gösterilir */
    private sorted<T extends { sortOrder: number | string }>(items: T[]): T[] {
        return [...items].sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
    }

    // ────────────────────────── Adım 4: İade formu ──────────────────────────

    /** Satır seçimleri lineId üzerinden tutulur */
    private keyOf(item: OrderTrackingItemResponse): string {
        return String(item.lineId);
    }

    quantityOf(item: OrderTrackingItemResponse): number {
        return this.selections[this.keyOf(item)]?.quantity ?? 0;
    }

    reasonOf(item: OrderTrackingItemResponse): string {
        return this.selections[this.keyOf(item)]?.returnCode ?? '';
    }

    /** Bir satırdan kaç adet iade edileceğini belirler */
    onQuantityChange(item: OrderTrackingItemResponse, value: number | string): void {
        const key = this.keyOf(item);
        const quantity = Number(value) || 0;
        if (quantity <= 0) {
            delete this.selections[key];
        } else {
            this.selections[key] = { quantity, returnCode: this.reasonOf(item) };
        }
        this.returnError = '';
    }

    onReasonChange(item: OrderTrackingItemResponse, returnCode: string): void {
        const key = this.keyOf(item);
        const current = this.selections[key];
        if (!current) return;
        this.selections[key] = { ...current, returnCode };
        this.returnError = '';
    }

    /** Adet seçim kutusunun seçenekleri: 0..satın alınan adet */
    quantityOptions(item: OrderTrackingItemResponse): number[] {
        const max = Math.max(0, Math.floor(Number(item.quantity ?? 0)));
        return Array.from({ length: max + 1 }, (_, index) => index);
    }

    get selectedLineCount(): number {
        return Object.keys(this.selections).length;
    }

    get selectedTotalQuantity(): number {
        return Object.values(this.selections).reduce((total, item) => total + item.quantity, 0);
    }

    /** Seçili satırların tutarı — tahmini hakediş için bilgi amaçlı */
    get selectedTotalAmount(): number {
        return (this.order?.items ?? []).reduce((total, item) => {
            return total + this.quantityOf(item) * Number(item.unitPrice ?? 0);
        }, 0);
    }

    /** 1. adım: en az bir satır seçili ve her seçili satırın nedeni girilmiş olmalı */
    get isStep1Valid(): boolean {
        const values = Object.values(this.selections);
        return values.length > 0 && values.every(item => !!item.returnCode);
    }

    /** Ödeme havale/EFT ile alındıysa iade tutarı müşterinin hesabına aktarılır */
    get isBankPayment(): boolean {
        return this.order?.paymentTypeCode === 'BankPayment';
    }

    /** IBAN alanları yalnızca banka hesabına iade yapılacak siparişlerde sorulur */
    get isIbanRequired(): boolean {
        return this.isBankPayment;
    }

    /** 2 harf ülke kodu + 2 kontrol hanesi; TR IBAN'ları toplam 26 karakterdir */
    get isIbanValid(): boolean {
        const iban = this.normalizedIban;
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
        return !iban.startsWith('TR') || iban.length === 26;
    }

    get isIbanAccountNameValid(): boolean {
        return this.returnIbanAccountName.trim().length >= 3;
    }

    /** Yazılmaya başlanmış ama henüz geçerli olmayan IBAN kırmızı gösterilir */
    get isIbanInvalidVisible(): boolean {
        return this.returnIban.trim().length > 0 && !this.isIbanValid;
    }

    get isStep2Valid(): boolean {
        if (!this.selectedActionCode) return false;
        if (!this.isIbanRequired) return true;
        return this.isIbanValid && this.isIbanAccountNameValid;
    }

    /** 2. adımda eksik olan alanı anlatan uyarı */
    private get step2ErrorMessage(): string {
        if (!this.selectedActionCode) return 'Lütfen nasıl bir işlem talep ettiğinizi seçin.';
        if (!this.isIbanValid) {
            return 'Siparişin ödemesi havale/EFT ile alındığı için iade tutarının aktarılacağı geçerli bir IBAN girmelisiniz.';
        }
        return "Lütfen IBAN'ın ait olduğu hesap sahibinin adını / ünvanını yazın.";
    }

    get isStep3Valid(): boolean {
        return !!this.selectedCargoExtensionId;
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
            this.returnError = this.step2ErrorMessage;
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

    selectCargoCompany(company: CargoCompanyResponse): void {
        this.selectedCargoExtensionId = company.cargoExtensionId;
        this.returnError = '';
    }

    /** IBAN boşluklarla yazılabildiği için gönderimden önce sadeleştirilir */
    private get normalizedIban(): string {
        return this.returnIban.replace(/\s+/g, '').toUpperCase();
    }

    /** Seçilen satırların hepsi aynı nedeni taşıyorsa talebin genel nedeni olarak gönderilir */
    private get commonReturnReasonCode(): string | null {
        const codes = new Set(Object.values(this.selections).map(selection => selection.returnCode));
        return codes.size === 1 ? [...codes][0] : null;
    }

    /** Seçili satırları API'nin beklediği iade satırlarına çevirir */
    private buildClaimLines(): CreateReturnClaimLineRequest[] {
        return (this.order?.items ?? [])
            .filter(item => this.quantityOf(item) > 0)
            .map(item => ({
                quantity: this.quantityOf(item),
                returnReasonCode: this.reasonOf(item),
                itemCode: item.stockCode,
                barcode: item.barcode,
                sourceImageUrl: item.imageUrl,
                // Pazaryeri satır kimliği; WMS sipariş satırı id'si panelde bilinmiyor
                externalClaimLineId: String(item.lineId),
            }));
    }

    /** İade talebini oluşturur ve iade kargo kodunu gösterir */
    async submitReturn(): Promise<void> {
        if (this.submittingReturn) return;
        if (!this.isStep2Valid && this.isStep1Valid) {
            // Havale ile ödenen siparişte IBAN alınmadan talep kapatılamaz
            this.returnStep = 2;
            this.returnError = this.step2ErrorMessage;
            return;
        }
        if (!this.isStep1Valid || !this.isStep2Valid || !this.isStep3Valid) {
            this.returnError = 'Lütfen tüm adımları tamamlayın.';
            return;
        }
        const request: CreateReturnClaimRequest = {
            ...this.orderRequest(),
            items: this.buildClaimLines(),
            returnReasonCode: this.commonReturnReasonCode,
            afterReturnActionCode: this.selectedActionCode,
            cargoExtensionId: this.selectedCargoExtensionId || null,
            customerNote: this.returnNote?.trim() || null,
            iban: this.normalizedIban || null,
            ibanAccountDescription: this.returnIbanAccountName?.trim() || null,
        };

        this.submittingReturn = true;
        this.returnError = '';
        try {
            if (this.isDemo) {
                await this.delay();
                this.returnResult = buildMockReturnResult(request);
            } else {
                const response = await this.service.createReturnClaim(request);
                if (!response.isSuccess || !response.data) {
                    this.returnError = this.messageFromResponse(response, 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.');
                    return;
                }
                this.returnResult = response.data;
            }
            if (this.cargoReferenceMissing) {
                // Referans yoksa neden oluşmadığını yalnızca konsola yaz; müşteriye teknik metin gösterilmez
                this.logTechnicalError('CARGO_NOT_CREATED', null, this.returnResult?.cargoErrorMessage);
            }
            this.step = 'result';
            this.showResultModal = true;
            await this.loadReturnClaims();
        } catch (err) {
            this.returnError = this.messageFrom(err, 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.');
        } finally {
            this.submittingReturn = false;
        }
    }

    /** Sonuç modalını kapatıp sipariş detayına döner */
    closeResultModal(): void {
        this.showResultModal = false;
        this.step = 'detail';
        if (this.order) this.order = { ...this.order, canRequestReturn: false };
        void this.loadReturnClaims();
    }

    /** İade kodunu panoya kopyalar */
    async copyReturnCode(): Promise<void> {
        await this.copyToClipboard(this.returnResult?.returnCode);
    }

    /**
     * Kargo entegrasyonundan dönen referans numarası.
     * `isCargoCreated` false ise ya da referans boşsa '' döner; ekranda
     * bunun yerine firma kodumuzla iade bilgilendirmesi gösterilir.
     */
    get cargoReferenceId(): string {
        if (!this.returnResult?.isCargoCreated) return '';
        return this.returnResult.cargo?.cargo?.cargoReferenceId?.trim() ?? '';
    }

    /** Kargo referansı alınamadı — müşteri firma kodumuzla iade edecek */
    get cargoReferenceMissing(): boolean {
        return !!this.returnResult && !this.cargoReferenceId;
    }

    /** Kargo referans numarasını panoya kopyalar */
    async copyCargoReferenceId(): Promise<void> {
        await this.copyToClipboard(this.cargoReferenceId);
    }

    private async copyToClipboard(value: string | null | undefined): Promise<void> {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(value);
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

    get selectedActionDescription(): string {
        return this.actions.find(action => action.actionCode === this.selectedActionCode)?.actionDescription ?? '';
    }

    get selectedCargoCompany(): CargoCompanyResponse | null {
        return this.cargoCompanies.find(company => company.cargoExtensionId === this.selectedCargoExtensionId) ?? null;
    }

    /**
     * HTTP hatasından kullanıcıya gösterilecek mesajı üretir.
     * Yalnızca `errorCode` eşlemesi ya da adımın genel mesajı gösterilir;
     * sunucudan gelen metin (SQL/exception detayı olabilir) ekrana basılmaz.
     */
    private messageFrom(err: unknown, fallback: string): string {
        const error = err as {
            status?: number;
            error?: { errorCode?: string; traceId?: string; innerError?: string };
        };
        this.logTechnicalError(error?.error?.errorCode, error?.error?.traceId, err);
        if (error?.status === 0) {
            return 'Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edip tekrar deneyin.';
        }
        return ERROR_MESSAGES[error?.error?.errorCode ?? ''] || fallback;
    }

    /** Başarısız ApiResponse için kullanıcıya gösterilecek mesaj */
    private messageFromResponse(
        response: { errorCode?: string | null; traceId?: string | null; innerError?: string | null },
        fallback: string,
    ): string {
        this.logTechnicalError(response.errorCode, response.traceId, response.innerError);
        return ERROR_MESSAGES[response.errorCode ?? ''] || fallback;
    }

    /** Teknik ayrıntı yalnızca konsola; ekranda gösterilmez */
    private logTechnicalError(errorCode: unknown, traceId: unknown, detail: unknown): void {
        console.error('[order-tracking] hata', { errorCode, traceId, detail });
    }

    private delay(): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, MOCK_DELAY_MS));
    }
}

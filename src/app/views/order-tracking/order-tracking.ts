import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    CargoCompanyResponse,
    CreateReturnClaimLineRequest,
    CreateReturnClaimRequest,
    OrderTrackingBrandResponse,
    OrderTrackingCargoTrackResponse,
    OrderTrackingContext,
    OrderTrackingDetailResponse,
    OrderTrackingItemResponse,
    OrderTrackingLinkOrderResponse,
    OrderTrackingOrderRequest,
    OrderTrackingSummaryResponse,
    ReturnClaimDetailLineResponse,
    ReturnClaimDetailResponse,
    ReturnClaimResultResponse,
    ReturnReasonOptionResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';
import { OrderTrackingService } from '@/app/core/services/order-tracking.service';
import { OrderTrackingLinksService } from '@/app/core/services/order-tracking-links.service';
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
 * İade tutarının nereye döneceğini belirleyen işlem tipi kodları
 * (WmsAfterReturnClaimActions — `actionCode`).
 */
const ACTION_CODE_CARD = 'CCPAY';
const ACTION_CODE_BANK = 'BANK';

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
    WMS_RETURNCLAIM_002: 'Bu siparişteki tüm ürünler için zaten iade talebi oluşturulmuş.',
    WMS_RETURNCLAIM_003: 'Bu sipariş için iade talebi oluşturulamaz.',
    WMS_RETURNCLAIM_015: 'Seçtiğiniz ürün bu siparişte bulunamadı. Lütfen seçiminizi kontrol edip tekrar deneyin.',
    WMS_RETURNCLAIM_016: 'Seçtiğiniz adet, ürünün iade edilebilir adedini aşıyor. Liste güncellendi; lütfen seçiminizi kontrol edin.',
    WMS_RETURNCLAIM_017: 'Bu sipariş için başka bir iade talebi işleniyor. Lütfen biraz sonra tekrar deneyin.',
    ORDERTRACK_008: 'Bu bağlantı geçersiz ya da kullanıma kapatılmış. Lütfen mağazayla iletişime geçin.',
    ORDERTRACK_009: 'Bu bağlantının süresi dolmuş. Yeni bir bağlantı için lütfen mağazayla iletişime geçin.',
};

/**
 * Talep gönderilirken sipariş iade kuralına takıldı (kapıda ödeme teslim edilmedi, süre doldu ...).
 * Gerekçe sunucunun hata metninden değil, yeniden çekilen siparişin `returnBlockReasons` alanından okunur.
 */
const RETURN_NOT_ALLOWED_CODE = 'WMS_RETURNCLAIM_003';

/** İade engeli gerekçesi gelmediğinde gösterilen genel mesaj */
const RETURN_BLOCKED_FALLBACK = 'Bu sipariş için iade talebi oluşturulamaz.';

/**
 * Talep gönderilirken satırların kalan iade adedi değişti (aynı siparişe başka bir talep açılmış ya da
 * seçim siparişle uyuşmuyor): güncel sipariş yeniden çekilir, kalan adedi aşan seçimler düzeltilir.
 * 002 tüm ürünler talep edilmiş, 015 ürün siparişte yok, 016 kalan adet aşıldı.
 */
const RETURN_QUANTITY_CHANGED_CODES = ['WMS_RETURNCLAIM_002', 'WMS_RETURNCLAIM_015', 'WMS_RETURNCLAIM_016'];

/** Siparişin tüm adetleri iade talebine girdiğinde gösterilen not */
const ALL_ITEMS_CLAIMED_TEXT = 'Siparişteki tüm ürünler için iade talebi oluşturulmuş.';

/** Sipariş bağlantısı açılamadığında, hata kodu eşlenemezse gösterilen mesaj */
const LINK_ERROR_FALLBACK = 'Sipariş bilgilerinize şu anda ulaşılamıyor. Lütfen daha sonra tekrar deneyin.';

type PanelStep = 'search' | 'verify' | 'detail' | 'return' | 'result';

const STEP_LABELS: { key: PanelStep; label: string }[] = [
    { key: 'search', label: 'Sorgulama' },
    { key: 'verify', label: 'Doğrulama' },
    { key: 'detail', label: 'Sipariş Detayı' },
    { key: 'return', label: 'İade Talebi' },
    { key: 'result', label: 'İade Kodu' },
];

/** Bağlantıyla gelen müşteri bu adımları görmez: sipariş bağlantıdan çözülür, SMS istenmez */
const LINK_SKIPPED_STEPS: PanelStep[] = ['search', 'verify'];

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
 *
 * Bağlantı modu — Route: /order-tracking/link/:token. Şirketin müşteriye gönderdiği
 * bağlantıdır; sorgulama ve SMS doğrulaması atlanır, sayfa doğrudan sipariş
 * detayıyla açılır. Sipariş, iade talepleri ve talep oluşturma `link/*` uçlarından
 * yalnızca anahtarla çağrılır; iade kataloğu ve marka şirket bazlı uçlardan gelir.
 */
@Component({
    selector: 'app-order-tracking',
    imports: [FormsModule, DatePipe, DecimalPipe, NgTemplateOutlet],
    templateUrl: './order-tracking.html',
    styleUrls: ['./order-tracking.scss'],
})
export class OrderTrackingPage implements OnInit, OnDestroy {
    stepLabels: { key: PanelStep; label: string }[] = STEP_LABELS;

    readonly currencyCode = CURRENCY_CODE;
    /** Test modunda sorgulanabilecek örnek sipariş kodu */
    readonly demoOrderNo = MOCK_ORDER_NO;

    context: OrderTrackingContext = { companyId: '', extensionId: '', orderNo: '' };
    /** URL'de şirket/eklenti parametresi yoksa true — test verileriyle çalışılır */
    isDemo = false;

    step: PanelStep = 'search';

    // ── Sipariş bağlantısı ──
    /** Route'taki bağlantı anahtarı; doluysa sayfa bağlantı modunda çalışır */
    linkToken = '';
    linkLoading = false;
    linkError = '';
    /** Bağlantının geçerlilik bitişi — detayda bilgi olarak gösterilir */
    linkExpireDate: string | null = null;

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
    /** İade kargolarının hareketleri — hareketler en yeni önce */
    returnCargoTracks: OrderTrackingCargoTrackResponse[] = [];
    /** Kargo hareketleri isteği yanıt vermedi; gönderi bazlı hata `isQueryFailed`'dadır */
    cargoTrackingError = false;

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
    /** Para iadesi bilgileri — banka hesabına iade (BANK) seçildiğinde zorunlu */
    returnIban = '';
    returnIbanAccountName = '';
    submittingReturn = false;
    returnError = '';

    // ── Sonuç ──
    returnResult: ReturnClaimResultResponse | null = null;
    showResultModal = false;

    constructor(
        private route: ActivatedRoute,
        private service: OrderTrackingService,
        private linkService: OrderTrackingLinksService,
    ) {}

    ngOnInit(): void {
        const params = this.route.snapshot.paramMap;
        this.linkToken = params.get('token') ?? '';
        if (this.isLinkMode) {
            this.stepLabels = STEP_LABELS.filter(item => !LINK_SKIPPED_STEPS.includes(item.key));
            this.step = 'detail';
            void this.openFromLink();
            return;
        }
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

    // ────────────────────────── Sipariş bağlantısı ──────────────────────────

    get isLinkMode(): boolean {
        return !!this.linkToken;
    }

    /**
     * Bağlantıyla gelindiğinde siparişi anahtardan çözer ve doğrudan detaya geçer.
     * Şirket / sağlayıcı kimliği marka ve iade kataloğu uçları için bağlamda tutulur.
     */
    private async openFromLink(): Promise<void> {
        this.linkLoading = true;
        this.linkError = '';
        try {
            const response = await this.linkService.getLinkOrder({ token: this.linkToken });
            if (!response.isSuccess || !response.data) {
                this.linkError = this.messageFromResponse(response, LINK_ERROR_FALLBACK);
                return;
            }
            this.applyLinkOrder(response.data);
            void this.loadBrand();
            void this.loadReturnCargoTracking();
            await this.loadReturnClaims();
        } catch (err) {
            this.linkError = this.messageFrom(err, LINK_ERROR_FALLBACK);
        } finally {
            this.linkLoading = false;
        }
    }

    private applyLinkOrder(data: OrderTrackingLinkOrderResponse): void {
        this.context = { companyId: data.companyId, extensionId: data.extensionId, orderNo: data.orderNumber };
        this.linkExpireDate = data.expireDate;
        this.order = data.order;
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
        this.returnCargoTracks = [];
        this.cargoTrackingError = false;
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
            void this.loadReturnCargoTracking();
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
        void this.loadReturnCargoTracking();
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
        if (this.isLinkMode) {
            const linkResponse = await this.linkService.getLinkOrder({ token: this.linkToken });
            if (!linkResponse.isSuccess || !linkResponse.data) {
                this.detailFetchError = this.messageFromResponse(linkResponse, 'Sipariş detayı alınamadı.');
                return null;
            }
            this.linkExpireDate = linkResponse.data.expireDate;
            return linkResponse.data.order;
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
                const response = this.isLinkMode
                    ? await this.linkService.getLinkReturnClaims({ token: this.linkToken })
                    : await this.service.getReturnClaimDetails(this.orderRequest());
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

    /**
     * Siparişin iade kargolarının hareketlerini çeker. Hareketler detayın yardımcı bilgisidir:
     * istek başarısız olursa detay yine gösterilir, kartta uyarı çıkar. Demo siparişte iade
     * talebi olmadığı için istek atılmaz. API hareketleri eskiden yeniye döner; ekranda son
     * durum en üstte görünsün diye ters çevrilir.
     */
    private async loadReturnCargoTracking(): Promise<void> {
        this.cargoTrackingError = false;
        if (this.isDemo) {
            this.returnCargoTracks = [];
            return;
        }
        try {
            const response = this.isLinkMode
                ? await this.linkService.getLinkReturnCargoTracking({ token: this.linkToken })
                : await this.service.getReturnCargoTracking(this.orderRequest());
            if (!response.isSuccess || !response.data) {
                this.logTechnicalError(response.errorCode, response.traceId, response.innerError);
                this.returnCargoTracks = [];
                this.cargoTrackingError = true;
                return;
            }
            this.returnCargoTracks = response.data.map(track => ({
                ...track,
                movements: [...(track.movements ?? [])].reverse(),
            }));
        } catch (err) {
            this.logTechnicalError(this.errorCodeOf(err), null, err);
            this.returnCargoTracks = [];
            this.cargoTrackingError = true;
        }
    }

    /** Hareket sorgusu olan firmadaki iade kargoları */
    get returnTracks(): OrderTrackingCargoTrackResponse[] {
        return this.returnCargoTracks.filter(track => track.isTrackingSupported);
    }

    /** "İade Kargosu" kartı: hareket sorgulanabilen iade kargosu varsa ya da istek başarısızsa */
    get showReturnTracking(): boolean {
        if (this.returnTracks.length) return true;
        return this.cargoTrackingError && this.returnClaims.some(claim => !!claim.cargoReferenceId);
    }

    get hasReturnClaim(): boolean {
        return this.returnClaims.length > 0;
    }

    /**
     * İade ürün satırı ve adet bazındadır: önceki talepler olsa da iade edilebilir adedi kalan
     * ürün varsa yeni talep açılabilir. Talebe girmiş adet (talep açık, kabul ya da red) tekrar seçilemez.
     */
    get canOpenReturnFlow(): boolean {
        return !!this.order?.canRequestReturn && this.hasReturnableItem && !this.claimsLoading;
    }

    /** Yeni talepte seçilebilecek adedi olan ürün var mı */
    get hasReturnableItem(): boolean {
        return (this.order?.items ?? []).some(item => this.returnableOf(item) > 0);
    }

    /** Siparişin tüm adetleri iade talebine girdi — engel değil bilgi olarak gösterilir */
    get allItemsClaimed(): boolean {
        const items = this.order?.items ?? [];
        return !this.hasReturnableItem && items.some(item => this.claimedOf(item) > 0);
    }

    /** Satırın daha önce iade talebine girmiş adedi (iptal edilen talepler hariç) */
    claimedOf(item: OrderTrackingItemResponse): number {
        return Math.max(0, Math.floor(Number(item.claimedQuantity ?? 0)));
    }

    /** Yeni talepte seçilebilecek kalan adet; alan gelmezse satın alınan adet */
    returnableOf(item: OrderTrackingItemResponse): number {
        const purchased = Math.max(0, Math.floor(Number(item.quantity ?? 0)));
        const returnable = Math.floor(Number(item.returnableQuantity ?? purchased));
        return Math.min(purchased, Math.max(0, returnable));
    }

    /**
     * Detayda iade engeli uyarısı: sipariş iade kuralına takıldıysa gösterilir. Tüm ürünler talep
     * edildiyse engel değil bilgi olduğu için ayrı not çıkar; talepler yüklenirken genel mesaj
     * yanıp sönmesin diye beklenir.
     */
    get showReturnBlocked(): boolean {
        return !!this.order && !this.order.canRequestReturn && !this.allItemsClaimed && !this.claimsLoading;
    }

    /** Detaydaki "İade Talebi" butonunun metni: önceki talep varsa kalan ürünler içindir */
    get returnButtonText(): string {
        return this.hasReturnClaim ? 'Kalan Ürünler İçin İade Talebi' : 'İade İşlemleri';
    }

    /** Tüm ürünler talep edildiğinde gösterilen not */
    readonly allItemsClaimedText = ALL_ITEMS_CLAIMED_TEXT;

    /** Detaydaki iade engeli gerekçeleri — her biri ayrı satırda gösterilir */
    get returnBlockReasons(): string[] {
        return this.blockReasons(this.order?.returnBlockReasons);
    }

    /** Sorgu sonucunda "İade Talebi Yap" yerine gösterilecek gerekçeler */
    get searchReturnBlockReasons(): string[] {
        return this.blockReasons(this.searchResult?.returnBlockReasons);
    }

    /** API'nin iade engeli gerekçeleri; gerekçe gelmezse genel mesaj */
    private blockReasons(reasons: string[] | null | undefined): string[] {
        const cleaned = (reasons ?? [])
            .map(reason => reason?.trim())
            .filter((reason): reason is string => !!reason);
        return cleaned.length ? cleaned : [RETURN_BLOCKED_FALLBACK];
    }

    /** Gerekçeler tek metinde — iade adımının hata alanı için */
    private returnBlockText(reasons: string[] | null | undefined): string {
        return this.blockReasons(reasons).join(' ');
    }

    /**
     * Talep gönderilirken sipariş iade kuralına takıldıysa güncel sipariş yeniden çekilir:
     * detay ekranı güncel duruma döner ve hata alanında engel gerekçeleri gösterilir.
     * Gerekçe gelmezse `ERROR_MESSAGES` karşılığı yerinde kalır.
     */
    private async showReturnBlockReasons(): Promise<void> {
        try {
            const order = await this.fetchOrderDetail();
            if (!order) return;
            this.order = order;
            if (order.returnBlockReasons?.length) {
                this.returnError = this.returnBlockText(order.returnBlockReasons);
            }
        } catch (err) {
            this.logTechnicalError(RETURN_NOT_ALLOWED_CODE, null, err);
        }
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

    /** Talep satırındaki ürünün KDV dahil birim fiyatı — sipariş satırından okunur */
    claimLineUnitPrice(line: ReturnClaimDetailLineResponse): number | null {
        const item = this.matchOrderItem(line);
        return item ? Number(item.unitPrice ?? 0) : null;
    }

    /**
     * Talep satırının iade tutarı (KDV dahil). Talep satırında tutar tutulmaz; sipariş
     * satırının toplamı iade adedine oranlanır. Yuvarlanmış birim fiyatı adetle çarpmak
     * kuruş kaydırdığı için satır toplamından gidilir. Satır eşleşmezse null.
     */
    claimLineAmount(line: ReturnClaimDetailLineResponse): number | null {
        const item = this.matchOrderItem(line);
        if (!item) return null;
        const orderedQuantity = Number(item.quantity ?? 0);
        const returnedQuantity = Number(line.quantity ?? 0);
        if (orderedQuantity <= 0) return Number(item.unitPrice ?? 0) * returnedQuantity;
        return (Number(item.totalAmount ?? 0) * returnedQuantity) / orderedQuantity;
    }

    /** Talebin toplam iade tutarı; tutarı bulunamayan satırlar toplama girmez */
    claimTotalAmount(claim: ReturnClaimDetailResponse): number {
        return claim.items.reduce((total, line) => total + (this.claimLineAmount(line) ?? 0), 0);
    }

    /** Tutarı sipariş satırından okunamayan talep satırı var mı */
    hasUnpricedClaimLine(claim: ReturnClaimDetailResponse): boolean {
        return claim.items.some(line => this.claimLineAmount(line) === null);
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
        // İade adımının hatası detayda tekrar görünmesin; engel gerekçesi detayda buton yerinde yazar
        this.returnError = '';
        this.step = 'detail';
    }

    private resetReturnForm(): void {
        this.selections = {};
        // Ödeme tipine tek işlem tipi uyuyorsa seçili gelir
        const actions = this.availableActions;
        this.selectedActionCode = actions.length === 1 ? actions[0].actionCode : '';
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

    /**
     * Adet seçim kutusunun seçenekleri: 0..kalan iade adedi. 2 adetlik satırın 1'i daha önce
     * talep edildiyse yalnızca kalan 1 adet seçilebilir.
     */
    quantityOptions(item: OrderTrackingItemResponse): number[] {
        const max = this.returnableOf(item);
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

    /** Ödeme kredi kartıyla (online) alındıysa iade tutarı aynı karta döner */
    get isCardPayment(): boolean {
        return this.order?.paymentTypeCode === 'CCPayment';
    }

    /**
     * Siparişin ödeme tipine uyan işlem tipleri: kartla ödenen siparişte banka
     * hesabına iade (BANK), havale ve kapıda ödemede (nakit / kredi kartı) ise
     * karta iade (CCPAY) sunulmaz.
     */
    get availableActions(): AfterReturnActionOptionResponse[] {
        const hiddenCode = this.isCardPayment ? ACTION_CODE_BANK : ACTION_CODE_CARD;
        return this.actions.filter(action => action.actionCode !== hiddenCode);
    }

    /** IBAN alanları yalnızca banka hesabına iade (BANK) seçildiğinde sorulur */
    get isIbanRequired(): boolean {
        return this.selectedActionCode === ACTION_CODE_BANK;
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
            return 'İade tutarının aktarılacağı geçerli bir IBAN girmelisiniz.';
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
            // Banka hesabına iadede IBAN alınmadan talep kapatılamaz
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
                // Bağlantı modunda sipariş istekten değil bağlantının anahtarından çözülür
                const response = this.isLinkMode
                    ? await this.linkService.createLinkReturnClaim({ token: this.linkToken, claim: request })
                    : await this.service.createReturnClaim(request);
                if (!response.isSuccess || !response.data) {
                    this.returnError = this.messageFromResponse(response, 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.');
                    await this.handleReturnRejection(response.errorCode ?? null);
                    return;
                }
                this.returnResult = response.data;
            }
            this.applyClaimedSelections();
            if (this.cargoReferenceMissing) {
                // Referans yoksa neden oluşmadığını yalnızca konsola yaz; müşteriye teknik metin gösterilmez
                this.logTechnicalError('CARGO_NOT_CREATED', null, this.returnResult?.cargoErrorMessage);
            }
            this.step = 'result';
            this.showResultModal = true;
            await this.loadReturnClaims();
        } catch (err) {
            this.returnError = this.messageFrom(err, 'İade talebi oluşturulamadı. Lütfen tekrar deneyin.');
            await this.handleReturnRejection(this.errorCodeOf(err));
        } finally {
            this.submittingReturn = false;
        }
    }

    /**
     * Talep reddedildiyse ekran güncel siparişe döner: iade kuralına takıldıysa engel gerekçeleri
     * gösterilir; kalan adet değiştiyse (başka bir talep açılmış) seçimler güncel adede göre düzeltilir.
     */
    private async handleReturnRejection(errorCode: string | null): Promise<void> {
        if (errorCode === RETURN_NOT_ALLOWED_CODE) {
            await this.showReturnBlockReasons();
        } else if (errorCode && RETURN_QUANTITY_CHANGED_CODES.includes(errorCode)) {
            await this.refreshOrderQuietly();
            this.clampSelections();
        }
    }

    /** Kalan iade adedini aşan seçimler kalan adede indirilir, kalanı olmayan satır seçimden çıkar */
    private clampSelections(): void {
        for (const item of this.order?.items ?? []) {
            const key = this.keyOf(item);
            const selection = this.selections[key];
            if (!selection) continue;
            const returnable = this.returnableOf(item);
            if (returnable <= 0) {
                delete this.selections[key];
            } else if (selection.quantity > returnable) {
                this.selections[key] = { ...selection, quantity: returnable };
            }
        }
    }

    /**
     * Talep açıldı: seçilen adetler sunucuyu beklemeden siparişten düşülür, böylece detay ekranı
     * aynı adet için yeniden talep sunmaz. Güncel değerler sonuç modalı kapanınca API'den çekilir.
     */
    private applyClaimedSelections(): void {
        if (!this.order) return;
        const items = this.order.items.map(item => {
            const selected = this.quantityOf(item);
            if (!selected) return item;
            return {
                ...item,
                claimedQuantity: this.claimedOf(item) + selected,
                returnableQuantity: Math.max(0, this.returnableOf(item) - selected),
            };
        });
        const hasReturnable = items.some(item => this.returnableOf(item) > 0);
        this.order = {
            ...this.order,
            items,
            canRequestReturn: this.order.canRequestReturn && hasReturnable,
            returnBlockReasons: hasReturnable ? this.order.returnBlockReasons : [ALL_ITEMS_CLAIMED_TEXT],
        };
    }

    /**
     * Sipariş detayı arka planda yenilenir (kalan iade adetleri). İstek başarısız olursa ekrandaki
     * değerler kalır; demo siparişte talep kaydı tutulmadığı için yerel değerler korunur.
     */
    private async refreshOrderQuietly(): Promise<void> {
        if (this.isDemo) return;
        try {
            const order = await this.fetchOrderDetail();
            if (order) this.order = order;
        } catch (err) {
            this.logTechnicalError(this.errorCodeOf(err), null, err);
        }
    }

    /** Sonuç modalını kapatıp sipariş detayına döner */
    closeResultModal(): void {
        this.showResultModal = false;
        this.step = 'detail';
        // Kalan iade adetleri sunucudan güncellenir; yerelde düşülen değerler o zamana kadar gösterilir
        void this.refreshOrderQuietly();
        void this.loadReturnClaims();
        // Yeni talebin iade kargosu açıldıysa hareket kartında görünsün
        void this.loadReturnCargoTracking();
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

    /** HTTP hatasının API hata kodu (`ApiResponse.errorCode`) */
    private errorCodeOf(err: unknown): string | null {
        return (err as { error?: { errorCode?: string } })?.error?.errorCode ?? null;
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

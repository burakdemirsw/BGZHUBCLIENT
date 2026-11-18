import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WmsReturnClaimsService } from '@/app/core/services/wms/wms-return-claims.service';
import { WmsReturnClaimLinesService } from '@/app/core/services/wms/wms-return-claim-lines.service';
import { WmsClaimStatusesService } from '@/app/core/services/wms/wms-claim-statuses.service';
import { WmsReturnReasonsService } from '@/app/core/services/wms/wms-return-reasons.service';
import { WmsAfterReturnActionsService } from '@/app/core/services/wms/wms-after-return-actions.service';
import { OrderTrackingService } from '@/app/core/services/order-tracking.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    ReturnClaimLineResponse,
    ReturnClaimResponse,
} from '@/app/core/models/wms/return-claim.models';
import {
    OrderTrackingCargoTrackResponse,
    ReturnClaimDecisionRequest,
    ReturnClaimDecisionResponse,
} from '@/app/core/models/order-tracking/order-tracking.models';
import { ClaimCodeLabels, buildClaimCodeLabels } from '../claim-code-labels';
import {
    ClaimAction,
    ClaimActionNotice,
    ClaimActionResult,
    canCancelClaim,
    claimActionNotice,
    claimStatusBadgeClass,
} from '../claim-actions';
import { OtpClaimActionModal } from '../claim-action-modal/claim-action-modal';

/** Onay / ret akışının hangi yönde çalıştığı */
type ClaimDecision = 'approve' | 'reject';

/**
 * İade talebi detayı — başlık bilgileri, talep satırları, karar (onay / ret),
 * iptal ve kalıcı silme işlemleri.
 * Uç noktalar:
 *   /api/wms/return-claims/{id}, /api/wms/return-claim-lines
 *   /order-tracking/return-claims/approve|reject|cancel|delete (POST, gövde: companyId + claimNumber)
 *   /order-tracking/return-claims/cargo-tracking (POST) — talebin iade kargosu hareketleri
 */
@Component({
    selector: 'app-otp-claim-detail-page',
    imports: [CommonModule, FormsModule, RouterLink, OtpClaimActionModal],
    templateUrl: './claim-detail.html',
    styleUrls: ['./claim-detail.scss'],
})
export class OtpClaimDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);
    private readonly claimsService = inject(WmsReturnClaimsService);
    private readonly linesService = inject(WmsReturnClaimLinesService);
    private readonly statusService = inject(WmsClaimStatusesService);
    private readonly reasonsService = inject(WmsReturnReasonsService);
    private readonly actionsService = inject(WmsAfterReturnActionsService);
    private readonly orderTrackingService = inject(OrderTrackingService);
    private readonly authState = inject(AuthStateService);

    claim: ReturnClaimResponse | null = null;
    lines: ReturnClaimLineResponse[] = [];
    labels: ClaimCodeLabels = { statuses: {}, reasons: {}, actions: {}, closed: {} };
    loading = false;
    linesLoading = false;
    errorMessage = '';

    // ────── Karar (onay / ret) durumu ──────
    /** Açık modalın yönü; `null` ise modal kapalı */
    decision: ClaimDecision | null = null;
    decisionNote = '';
    /** Karar sonrası müşteriye bilgilendirme SMS'i gitsin mi */
    decisionSendSms = true;
    decisionSaving = false;
    decisionError = '';
    /** Sonuç bildiriminde SMS'in neden gitmediğini ayırt etmek için son seçim */
    decisionSmsRequested = true;
    /** Son kararın sonucu — yeni durum ve SMS bilgilendirmesinin akıbeti */
    decisionResult: ReturnClaimDecisionResponse | null = null;

    // ────── İptal / silme durumu ──────
    /** Açık modalın işlemi; `null` ise modal kapalı */
    claimAction: ClaimAction | null = null;
    /** Son iptalin sonucu — kargo gönderisi kapatılamadıysa uyarı olarak gösterilir */
    actionNotice: ClaimActionNotice | null = null;

    // ────── İade kargosu hareketleri ──────
    /** Talebin iade kargoları (normalde tek gönderi); hareketler en yeni önce */
    returnCargoTracks: OrderTrackingCargoTrackResponse[] = [];
    cargoTrackingLoading = false;
    cargoTrackingError = '';

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        void this.load(id);
    }

    private async load(id: string): Promise<void> {
        if (!id) {
            this.errorMessage = 'Talep kaydı bulunamadı.';
            return;
        }
        this.loading = true;
        this.errorMessage = '';
        try {
            const [response, labels] = await Promise.all([
                this.claimsService.getById(id),
                buildClaimCodeLabels(this.statusService, this.reasonsService, this.actionsService),
            ]);
            this.labels = labels;
            if (!response.isSuccess || !response.data) {
                this.errorMessage = 'Talep kaydı bulunamadı.';
                return;
            }
            this.claim = response.data;
            void this.loadCargoTracking();
            await this.loadLines(this.claim.id);
        } catch (err) {
            console.error('İade talebi yüklenemedi:', err);
            this.errorMessage = 'Talep kaydı yüklenemedi.';
        } finally {
            this.loading = false;
        }
    }

    private async loadLines(claimHeaderId: string): Promise<void> {
        this.linesLoading = true;
        try {
            this.lines = await this.linesService.getByClaim(claimHeaderId);
        } catch (err) {
            console.error('Talep satırları yüklenemedi:', err);
            this.lines = [];
        } finally {
            this.linesLoading = false;
        }
    }

    // ────── İade kargosu hareketleri ──────
    /**
     * Talebin iade kargosu hareketlerini çeker. Hareketler yardımcı bilgidir: alınamazsa talep
     * detayı yine çalışır, kargo kartında uyarı gösterilir. API eskiden yeniye döner; son
     * durum en üstte görünsün diye ters çevrilir.
     */
    async loadCargoTracking(): Promise<void> {
        const target = this.decisionTarget;
        if (!target || this.cargoTrackingLoading) return;

        this.cargoTrackingLoading = true;
        this.cargoTrackingError = '';
        try {
            const response = await this.orderTrackingService.getReturnClaimCargoTracking(target);
            if (!response.isSuccess || !response.data) {
                this.returnCargoTracks = [];
                this.cargoTrackingError = 'Kargo hareketleri alınamadı.';
                return;
            }
            this.returnCargoTracks = response.data.map(track => ({
                ...track,
                movements: [...(track.movements ?? [])].reverse(),
            }));
        } catch (err) {
            console.error('Kargo hareketleri yüklenemedi:', err);
            this.returnCargoTracks = [];
            this.cargoTrackingError = 'Kargo hareketleri alınamadı.';
        } finally {
            this.cargoTrackingLoading = false;
        }
    }

    // ────── Kod → metin çevirileri ──────
    statusName(statusCode: unknown): string {
        return this.labels.statuses[String(statusCode ?? '')] || '—';
    }

    readonly statusBadgeClass = claimStatusBadgeClass;

    reasonName(returnCode: string | null): string {
        if (!returnCode) return '—';
        return this.labels.reasons[returnCode] || returnCode;
    }

    actionName(actionCode: string | null): string {
        if (!actionCode) return '—';
        return this.labels.actions[actionCode] || actionCode;
    }

    /** Satırdaki ürünün kod ve varyant bilgisi tek metinde */
    lineTitle(line: ReturnClaimLineResponse): string {
        const code = line.itemCode || 'Ürün';
        const variant = [line.colorCode, line.itemDim1Code, line.batchCode].filter(Boolean).join(' · ');
        return variant ? `${code} (${variant})` : code;
    }

    /** Müşteri / ödeme kartı yalnızca dolu alan varsa gösterilir */
    get hasPaymentInfo(): boolean {
        const claim = this.claim;
        return !!(claim?.customerDescription || claim?.iban || claim?.ibanAccountDescription);
    }

    get totalQuantity(): number {
        return this.lines.reduce((total, line) => total + Number(line.quantity ?? 0), 0);
    }

    // ────── Karar akışı ──────
    /** Talep kapandı mı (kabul / red / iptal) — kapalı taleplere yeni karar verilemez */
    get isClosed(): boolean {
        return !!this.claim && this.labels.closed[String(this.claim.statusCode ?? '')] === true;
    }

    /** Şirket kimliği kaydın kendisinden, yoksa oturumdan okunur */
    private get companyId(): string {
        return this.claim?.companyId || this.authState.profile?.companyId || '';
    }

    /**
     * Karar uçları yalnızca şirket ve talep numarasıyla çalışır; ikisinden biri
     * eksikse buton yerine nedenini yazan uyarı çıkar.
     */
    private get decisionTarget(): { companyId: string; claimNumber: string } | null {
        const claimNumber = this.claim?.claimNumber;
        const companyId = this.companyId;
        if (!claimNumber || !companyId) return null;
        return { companyId, claimNumber };
    }

    get canDecide(): boolean {
        return !!this.claim && !this.isClosed && !!this.decisionTarget;
    }

    /** Karar verilemiyorsa nedenini tek cümlede açıklar */
    get decisionBlockedReason(): string {
        const claim = this.claim;
        if (!claim || this.canDecide) return '';
        if (this.isClosed) return `Talep "${this.statusName(claim.statusCode)}" durumunda; yeni karar verilemez.`;
        if (!claim.claimNumber) return 'Talebin talep no bilgisi eksik olduğu için karar verilemiyor.';
        return 'Talep karara bağlanamıyor.';
    }

    openDecision(decision: ClaimDecision): void {
        this.decision = decision;
        this.decisionNote = '';
        this.decisionSendSms = true;
        this.decisionError = '';
    }

    closeDecision(): void {
        if (this.decisionSaving) return;
        this.decision = null;
        this.decisionNote = '';
        this.decisionError = '';
    }

    /** Modaldaki onay butonu — kararı gönderir, başarılıysa kaydı tazeler */
    async submitDecision(): Promise<void> {
        const target = this.decisionTarget;
        const decision = this.decision;
        if (!target || !decision || this.decisionSaving) return;

        this.decisionSaving = true;
        this.decisionError = '';
        try {
            const request: ReturnClaimDecisionRequest = {
                companyId: target.companyId,
                claimNumber: target.claimNumber,
                note: this.decisionNote.trim() || null,
                isSendSms: this.decisionSendSms,
            };
            this.decisionSmsRequested = this.decisionSendSms;
            const response = decision === 'approve'
                ? await this.orderTrackingService.approveReturnClaim(request)
                : await this.orderTrackingService.rejectReturnClaim(request);

            if (!response.isSuccess || !response.data) {
                this.decisionError = response.innerError || 'İşlem tamamlanamadı, lütfen tekrar deneyin.';
                return;
            }

            this.decisionResult = response.data;
            this.decision = null;
            this.decisionNote = '';
            if (this.claim) await this.refresh(this.claim.id);
        } catch (err) {
            console.error('Talep kararı gönderilemedi:', err);
            this.decisionError = 'İşlem tamamlanamadı, lütfen tekrar deneyin.';
        } finally {
            this.decisionSaving = false;
        }
    }

    /** Karardan sonra başlık ve satırları yeniden okur (durum alanları değişir) */
    private async refresh(id: string): Promise<void> {
        try {
            const response = await this.claimsService.getById(id);
            if (response.isSuccess && response.data) this.claim = response.data;
            await this.loadLines(id);
        } catch (err) {
            console.error('İade talebi yenilenemedi:', err);
        }
    }

    dismissDecisionResult(): void {
        this.decisionResult = null;
    }

    // ────── İptal / silme akışı ──────
    get canCancel(): boolean {
        return !!this.claim && canCancelClaim(this.claim);
    }

    openAction(action: ClaimAction): void {
        this.claimAction = action;
    }

    closeAction(): void {
        this.claimAction = null;
    }

    /** Silinen talebin detayı kalmadığı için listeye dönülür; iptalde kayıt tazelenir */
    async onActionCompleted(result: ClaimActionResult): Promise<void> {
        this.claimAction = null;
        if (result.action === 'delete') {
            await this.router.navigate(['/otp/claims']);
            return;
        }
        this.decisionResult = null;
        this.actionNotice = claimActionNotice(result);
        await this.refresh(result.claimId);
        // İptalde iade kargosu da kapanır; hareket kartı güncel durumu göstersin
        void this.loadCargoTracking();
    }

    dismissActionNotice(): void {
        this.actionNotice = null;
    }
}

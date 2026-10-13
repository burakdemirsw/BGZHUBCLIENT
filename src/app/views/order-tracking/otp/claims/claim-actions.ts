import { ReturnClaimResponse } from '@/app/core/models/wms/return-claim.models';
import { ReturnClaimCancelResponse } from '@/app/core/models/order-tracking/order-tracking.models';

/** Liste ve detay ekranındaki personel işlemleri */
export type ClaimAction = 'cancel' | 'delete';

/** dbo.WmsReturnClaimStatus: 9 İptal */
export const CANCELLED_STATUS_CODE = 9;

/** Modal tamamlanınca üst sayfaya dönen sonuç */
export interface ClaimActionResult {
    action: ClaimAction;
    claimId: string;
    claimNumber: string;
    /** Yalnızca iptalde dolu */
    cancel: ReturnClaimCancelResponse | null;
}

/** İşlem sonrası sayfanın üstünde gösterilen bildirim */
export interface ClaimActionNotice {
    type: 'success' | 'warning';
    text: string;
}

export function isClaimCancelled(claim: ReturnClaimResponse): boolean {
    return Number(claim.statusCode) === CANCELLED_STATUS_CODE;
}

/**
 * Talebin firmada açık kargo gönderisi var mı? Gönderi açıkken referans numarası
 * talebe işlenir, iptal edilince düşer.
 */
export function hasOpenCargo(claim: ReturnClaimResponse): boolean {
    return !!claim.cargoReferenceId;
}

/**
 * İptal edilmemiş talep iptal edilebilir. İptal edilmiş talepte önceki iptalde
 * firmada kapatılamayan gönderi varsa iptal, gönderi iptalini yeniden dener.
 */
export function canCancelClaim(claim: ReturnClaimResponse): boolean {
    return !!claim.claimNumber && (!isClaimCancelled(claim) || hasOpenCargo(claim));
}

/** Durum rozetinin rengi — kabul yeşil, red kırmızı, iptal gri */
export function claimStatusBadgeClass(statusCode: unknown): string {
    switch (Number(statusCode)) {
        case 4: return 'bg-success-subtle text-success';
        case 5: return 'bg-danger-subtle text-danger';
        case CANCELLED_STATUS_CODE: return 'bg-secondary-subtle text-secondary';
        case 2:
        case 3: return 'bg-warning-subtle text-warning';
        default: return 'bg-info-subtle text-info';
    }
}

/** İptal sonucunu listedeki kayda işler (kargo gönderisi kapandıysa referansı da düşer) */
export function applyCancelResult(claim: ReturnClaimResponse, result: ReturnClaimCancelResponse): ReturnClaimResponse {
    return {
        ...claim,
        statusCode: result.statusCode,
        note: result.note,
        cargoReferenceId: result.hasOpenCargo ? claim.cargoReferenceId : null,
        cargoTrackingNumber: result.hasOpenCargo ? claim.cargoTrackingNumber : null,
    };
}

export function claimActionNotice(result: ClaimActionResult): ClaimActionNotice {
    if (result.action === 'delete') {
        return { type: 'success', text: `${result.claimNumber} numaralı talep silindi.` };
    }
    const cancel = result.cancel;
    if (cancel?.hasOpenCargo) {
        return {
            type: 'warning',
            text: `${result.claimNumber} numaralı talep iptal edildi ancak kargo gönderisi firmada iptal edilemedi`
                + (cancel.cargoError ? `: ${cancel.cargoError}` : '.')
                + ' Gönderi iptalini yeniden denemek için "İptal Et"e tekrar basabilirsiniz.',
        };
    }
    return { type: 'success', text: `${result.claimNumber} numaralı talep iptal edildi.` };
}

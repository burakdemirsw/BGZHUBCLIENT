import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrderTrackingService } from '@/app/core/services/order-tracking.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ReturnClaimResponse } from '@/app/core/models/wms/return-claim.models';
import { ClaimAction, ClaimActionResult, hasOpenCargo, isClaimCancelled } from '../claim-actions';

/**
 * İade talebini iptal etme / silme onay modalı — liste ve detay ekranı ortak kullanır.
 * Üst sayfa modalı `@if` ile açar; her açılışta yeni örnek oluştuğu için form temiz başlar.
 * Uçlar: /order-tracking/return-claims/cancel|delete (POST, gövde: companyId + claimNumber)
 */
@Component({
    selector: 'app-otp-claim-action-modal',
    imports: [FormsModule],
    templateUrl: './claim-action-modal.html',
    styleUrls: ['./claim-action-modal.scss'],
})
export class OtpClaimActionModal {
    private readonly orderTrackingService = inject(OrderTrackingService);
    private readonly authState = inject(AuthStateService);

    @Input({ required: true }) claim!: ReturnClaimResponse;
    @Input({ required: true }) action!: ClaimAction;
    /** Talebin mevcut durumunun ekrandaki adı */
    @Input() statusName = '';

    @Output() completed = new EventEmitter<ClaimActionResult>();
    @Output() closed = new EventEmitter<void>();

    note = '';
    saving = false;
    error = '';

    get isCancel(): boolean {
        return this.action === 'cancel';
    }

    get hasOpenCargo(): boolean {
        return hasOpenCargo(this.claim);
    }

    /** İptal edilmiş talepte iptal yalnızca açık kalan gönderiyi kapatmayı dener */
    get isCargoRetry(): boolean {
        return this.isCancel && isClaimCancelled(this.claim);
    }

    /** Açık gönderisi olan talep silinmez; önce iptal edilmelidir */
    get isDeleteBlocked(): boolean {
        return !this.isCancel && this.hasOpenCargo;
    }

    /** Şirket kimliği kaydın kendisinden, yoksa oturumdan okunur */
    private get companyId(): string {
        return this.claim.companyId || this.authState.profile?.companyId || '';
    }

    close(): void {
        if (this.saving) return;
        this.closed.emit();
    }

    async submit(): Promise<void> {
        const claimNumber = this.claim.claimNumber;
        const companyId = this.companyId;
        if (this.saving || this.isDeleteBlocked) return;
        if (!claimNumber || !companyId) {
            this.error = 'Talebin talep no bilgisi eksik olduğu için işlem yapılamıyor.';
            return;
        }

        this.saving = true;
        this.error = '';
        try {
            if (this.isCancel) {
                const response = await this.orderTrackingService.cancelReturnClaim({
                    companyId,
                    claimNumber,
                    note: this.note.trim() || null,
                });
                if (!response.isSuccess || !response.data) {
                    this.error = response.innerError || 'İşlem tamamlanamadı, lütfen tekrar deneyin.';
                    return;
                }
                this.completed.emit({ action: 'cancel', claimId: this.claim.id, claimNumber, cancel: response.data });
            } else {
                const response = await this.orderTrackingService.deleteReturnClaim({ companyId, claimNumber });
                if (!response.isSuccess) {
                    this.error = response.innerError || 'İşlem tamamlanamadı, lütfen tekrar deneyin.';
                    return;
                }
                this.completed.emit({ action: 'delete', claimId: this.claim.id, claimNumber, cancel: null });
            }
        } catch (err) {
            console.error('İade talebi işlemi başarısız:', err);
            this.error = this.errorMessage(err);
        } finally {
            this.saving = false;
        }
    }

    /** Personel ekranı: iş kuralı hataları (ör. açık gönderi) backend mesajıyla gösterilir */
    private errorMessage(err: unknown): string {
        const error = err as { status?: number; error?: { message?: string } };
        if (error?.status === 0) return 'Sunucuya bağlanılamadı.';
        return error?.error?.message || 'İşlem tamamlanamadı, lütfen tekrar deneyin.';
    }
}

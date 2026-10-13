import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsListPage } from '@/app/views/wms/shared/wms-list-page';
import { WmsReturnClaimsService } from '@/app/core/services/wms/wms-return-claims.service';
import { WmsClaimStatusesService } from '@/app/core/services/wms/wms-claim-statuses.service';
import { WmsReturnReasonsService } from '@/app/core/services/wms/wms-return-reasons.service';
import { WmsAfterReturnActionsService } from '@/app/core/services/wms/wms-after-return-actions.service';
import { ReturnClaimResponse } from '@/app/core/models/wms/return-claim.models';
import { ClaimCodeLabels, buildClaimCodeLabels } from './claim-code-labels';
import {
    ClaimAction,
    ClaimActionNotice,
    ClaimActionResult,
    applyCancelResult,
    canCancelClaim,
    claimActionNotice,
    claimStatusBadgeClass,
} from './claim-actions';
import { OtpClaimActionModal } from './claim-action-modal/claim-action-modal';

/**
 * İade talepleri listesi — müşteri panelinden ya da pazaryeri aktarımından
 * oluşan talepleri gösterir. Kayıtlar buradan düzenlenmez, detayı açılır;
 * satırdan talep iptal edilebilir ya da kalıcı olarak silinebilir.
 * Uç noktalar: /api/wms/return-claims, /order-tracking/return-claims/cancel|delete
 */
@Component({
    selector: 'app-otp-claims-page',
    imports: [CommonModule, FormsModule, RouterLink, OtpClaimActionModal],
    templateUrl: './claims.html',
    styleUrls: ['./claims.scss'],
})
export class OtpClaimsPage extends WmsListPage<ReturnClaimResponse> {
    private readonly service = inject(WmsReturnClaimsService);
    private readonly statusService = inject(WmsClaimStatusesService);
    private readonly reasonsService = inject(WmsReturnReasonsService);
    private readonly actionsService = inject(WmsAfterReturnActionsService);

    /** Kodların ekranda gösterilecek karşılıkları */
    labels: ClaimCodeLabels = { statuses: {}, reasons: {}, actions: {}, closed: {} };

    // ────── İptal / silme ──────
    /** Açık modalın işlemi; `null` ise modal kapalı */
    claimAction: ClaimAction | null = null;
    actionTarget: ReturnClaimResponse | null = null;
    /** Son işlemin sonucu — tablonun üstünde gösterilir */
    actionNotice: ClaimActionNotice | null = null;

    readonly canCancel = canCancelClaim;
    readonly statusBadgeClass = claimStatusBadgeClass;

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLabels();
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ReturnClaimResponse>> {
        return this.service.getPaged(request);
    }

    private async loadLabels(): Promise<void> {
        this.labels = await buildClaimCodeLabels(this.statusService, this.reasonsService, this.actionsService);
    }

    statusName(statusCode: unknown): string {
        return this.labels.statuses[String(statusCode ?? '')] || '—';
    }

    reasonName(returnCode: string | null): string {
        if (!returnCode) return '—';
        return this.labels.reasons[returnCode] || returnCode;
    }

    actionName(actionCode: string | null): string {
        if (!actionCode) return '—';
        return this.labels.actions[actionCode] || actionCode;
    }

    openAction(item: ReturnClaimResponse, action: ClaimAction): void {
        this.actionTarget = item;
        this.claimAction = action;
    }

    closeAction(): void {
        this.claimAction = null;
        this.actionTarget = null;
    }

    /** İptalde kayıt yerinde güncellenir; silmede sayfa yeniden yüklenir */
    onActionCompleted(result: ClaimActionResult): void {
        this.actionNotice = claimActionNotice(result);
        this.closeAction();
        if (result.action === 'delete') {
            void this.loadItems();
            return;
        }
        if (result.cancel) {
            const cancel = result.cancel;
            this.pagedItems = this.pagedItems.map(item =>
                item.id === result.claimId ? applyCancelResult(item, cancel) : item,
            );
        }
    }

    dismissNotice(): void {
        this.actionNotice = null;
    }
}

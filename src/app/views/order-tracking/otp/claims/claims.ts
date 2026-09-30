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

/**
 * İade talepleri listesi — müşteri panelinden ya da pazaryeri aktarımından
 * oluşan talepleri gösterir. Kayıtlar buradan düzenlenmez, detayı açılır.
 * Uç nokta: /api/wms/return-claims
 */
@Component({
    selector: 'app-otp-claims-page',
    imports: [CommonModule, FormsModule, RouterLink],
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
}

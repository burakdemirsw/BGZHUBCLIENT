import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { WmsReturnClaimsService } from '@/app/core/services/wms/wms-return-claims.service';
import { WmsReturnClaimLinesService } from '@/app/core/services/wms/wms-return-claim-lines.service';
import { WmsClaimStatusesService } from '@/app/core/services/wms/wms-claim-statuses.service';
import { WmsReturnReasonsService } from '@/app/core/services/wms/wms-return-reasons.service';
import { WmsAfterReturnActionsService } from '@/app/core/services/wms/wms-after-return-actions.service';
import {
    ReturnClaimLineResponse,
    ReturnClaimResponse,
} from '@/app/core/models/wms/return-claim.models';
import { ClaimCodeLabels, buildClaimCodeLabels } from '../claim-code-labels';

/**
 * İade talebi detayı — başlık bilgileri ve talep satırları.
 * Uç noktalar: /api/wms/return-claims/{id} ve /api/wms/return-claim-lines
 */
@Component({
    selector: 'app-otp-claim-detail-page',
    imports: [CommonModule, RouterLink],
    templateUrl: './claim-detail.html',
    styleUrls: ['./claim-detail.scss'],
})
export class OtpClaimDetailPage implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly claimsService = inject(WmsReturnClaimsService);
    private readonly linesService = inject(WmsReturnClaimLinesService);
    private readonly statusService = inject(WmsClaimStatusesService);
    private readonly reasonsService = inject(WmsReturnReasonsService);
    private readonly actionsService = inject(WmsAfterReturnActionsService);

    claim: ReturnClaimResponse | null = null;
    lines: ReturnClaimLineResponse[] = [];
    labels: ClaimCodeLabels = { statuses: {}, reasons: {}, actions: {} };
    loading = false;
    linesLoading = false;
    errorMessage = '';

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

    /** Satırdaki ürünün kod ve varyant bilgisi tek metinde */
    lineTitle(line: ReturnClaimLineResponse): string {
        const code = line.itemCode || line.sourceItemCode || 'Ürün';
        const variant = [line.colorCode, line.batchCode].filter(Boolean).join(' · ');
        return variant ? `${code} (${variant})` : code;
    }

    get totalQuantity(): number {
        return this.lines.reduce((total, line) => total + Number(line.quantity ?? 0), 0);
    }

    get totalAccepted(): number {
        return this.lines.reduce((total, line) => total + Number(line.acceptedQuantity ?? 0), 0);
    }

    get totalRejected(): number {
        return this.lines.reduce((total, line) => total + Number(line.rejectedQuantity ?? 0), 0);
    }
}

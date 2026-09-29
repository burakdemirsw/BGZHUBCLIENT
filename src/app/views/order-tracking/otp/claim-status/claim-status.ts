import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsClaimStatusesService } from '@/app/core/services/wms/wms-claim-statuses.service';
import {
    ClaimStatusResponse,
    UpdateClaimStatusRequest,
} from '@/app/core/models/wms/claim-status.models';

interface ClaimStatusForm {
    statusCode: number;
    statusDescription: string;
    matchKeywords: string;
    isClosed: boolean;
    sortOrder: number;
    isActive: boolean;
}

const EMPTY_FORM: ClaimStatusForm = {
    statusCode: 0,
    statusDescription: '',
    matchKeywords: '',
    isClosed: false,
    sortOrder: 0,
    isActive: true,
};

/**
 * İade talebi durumları — talep listesinde ve müşteri panelinde gösterilen
 * durum metinlerini yönetir. `matchKeywords`, pazaryerinden gelen durum
 * metnini bu koda eşlemek için kullanılır.
 * Uç nokta: /api/wms/claim-status
 */
@Component({
    selector: 'app-otp-claim-status-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './claim-status.html',
    styleUrls: ['./claim-status.scss'],
})
export class OtpClaimStatusPage extends WmsCrudPage<ClaimStatusResponse, ClaimStatusForm> {
    private readonly service = inject(WmsClaimStatusesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ClaimStatusResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): ClaimStatusForm {
        return { ...EMPTY_FORM, statusCode: this.nextStatusCode(), sortOrder: this.nextSortOrder() };
    }

    protected toForm(item: ClaimStatusResponse): ClaimStatusForm {
        return {
            statusCode: Number(item.statusCode ?? 0),
            statusDescription: item.statusDescription || '',
            matchKeywords: item.matchKeywords || '',
            isClosed: item.isClosed,
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ClaimStatusResponse): string {
        return item.statusDescription || String(item.statusCode ?? '');
    }

    get isFormValid(): boolean {
        return (
            !!this.form.statusDescription.trim() &&
            Number.isInteger(Number(this.form.statusCode)) &&
            Number(this.form.statusCode) >= 0 &&
            Number.isInteger(Number(this.form.sortOrder))
        );
    }

    /** Eşleştirme anahtarları virgülle ayrılır; listede rozet olarak gösterilir */
    keywordList(matchKeywords: string | null): string[] {
        if (!matchKeywords) return [];
        return matchKeywords
            .split(',')
            .map(keyword => keyword.trim())
            .filter(Boolean);
    }

    protected createItem(form: ClaimStatusForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ClaimStatusForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    /** Yeni kayıt için görüntülenen sayfadaki en büyük kodun bir fazlası */
    private nextStatusCode(): number {
        const codes = this.pagedItems.map(item => Number(item.statusCode ?? 0));
        return codes.length ? Math.max(...codes) + 1 : 1;
    }

    private nextSortOrder(): number {
        const orders = this.pagedItems.map(item => Number(item.sortOrder ?? 0));
        return orders.length ? Math.max(...orders) + 10 : 10;
    }

    private toPayload(form: ClaimStatusForm): UpdateClaimStatusRequest {
        return {
            statusCode: Number(form.statusCode),
            statusDescription: form.statusDescription.trim(),
            matchKeywords: form.matchKeywords.trim(),
            isClosed: form.isClosed,
            sortOrder: Number(form.sortOrder),
            isActive: form.isActive,
        };
    }
}

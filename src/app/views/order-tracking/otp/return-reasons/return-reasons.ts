import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsReturnReasonsService } from '@/app/core/services/wms/wms-return-reasons.service';
import {
    ReturnReasonResponse,
    UpdateReturnReasonRequest,
} from '@/app/core/models/wms/return-reason.models';

interface ReturnReasonForm {
    returnCode: string;
    returnReasonDescription: string;
    sortOrder: number;
    isActive: boolean;
}

const EMPTY_FORM: ReturnReasonForm = {
    returnCode: '',
    returnReasonDescription: '',
    sortOrder: 0,
    isActive: true,
};

/**
 * İade nedenleri — sipariş takip panelinde müşteriye sunulan
 * "Neden iade ediyorsunuz?" listesini yönetir.
 */
@Component({
    selector: 'app-otp-return-reasons-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './return-reasons.html',
    styleUrls: ['./return-reasons.scss'],
})
export class OtpReturnReasonsPage extends WmsCrudPage<ReturnReasonResponse, ReturnReasonForm> {
    private readonly service = inject(WmsReturnReasonsService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ReturnReasonResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): ReturnReasonForm {
        return { ...EMPTY_FORM, sortOrder: this.nextSortOrder() };
    }

    protected toForm(item: ReturnReasonResponse): ReturnReasonForm {
        return {
            returnCode: item.returnCode || '',
            returnReasonDescription: item.returnReasonDescription || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ReturnReasonResponse): string {
        return item.returnReasonDescription || item.returnCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.returnCode.trim() &&
            !!this.form.returnReasonDescription.trim() &&
            Number.isInteger(Number(this.form.sortOrder))
        );
    }

    protected createItem(form: ReturnReasonForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ReturnReasonForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    /** Yeni kayıt için görüntülenen sayfadaki en büyük sıranın bir fazlası */
    private nextSortOrder(): number {
        const orders = this.pagedItems.map(item => Number(item.sortOrder ?? 0));
        return orders.length ? Math.max(...orders) + 1 : 1;
    }

    private toPayload(form: ReturnReasonForm): UpdateReturnReasonRequest {
        return {
            returnCode: form.returnCode.trim(),
            returnReasonDescription: form.returnReasonDescription.trim(),
            sortOrder: Number(form.sortOrder),
            isActive: form.isActive,
        };
    }
}

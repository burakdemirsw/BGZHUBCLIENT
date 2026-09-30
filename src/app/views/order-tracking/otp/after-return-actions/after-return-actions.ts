import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsAfterReturnActionsService } from '@/app/core/services/wms/wms-after-return-actions.service';
import {
    AfterReturnActionResponse,
    UpdateAfterReturnActionRequest,
} from '@/app/core/models/wms/after-return-action.models';

interface AfterReturnActionForm {
    actionCode: string;
    actionDescription: string;
    sortOrder: number;
}

const EMPTY_FORM: AfterReturnActionForm = {
    actionCode: '',
    actionDescription: '',
    sortOrder: 0,
};

/**
 * İade sonrası işlem tipleri — sipariş takip panelinde müşteriye sorulan
 * "Nasıl bir işlem talep ediyorsunuz?" listesini yönetir.
 * Kayıtlar sistem genelinde ortaktır (şirket bazlı değil).
 * Uç nokta: /api/wms/after-return-claim-actions
 */
@Component({
    selector: 'app-otp-after-return-actions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './after-return-actions.html',
    styleUrls: ['./after-return-actions.scss'],
})
export class OtpAfterReturnActionsPage extends WmsCrudPage<AfterReturnActionResponse, AfterReturnActionForm> {
    private readonly service = inject(WmsAfterReturnActionsService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<AfterReturnActionResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): AfterReturnActionForm {
        return { ...EMPTY_FORM, sortOrder: this.nextSortOrder() };
    }

    protected toForm(item: AfterReturnActionResponse): AfterReturnActionForm {
        return {
            actionCode: item.actionCode || '',
            actionDescription: item.actionDescription || '',
            sortOrder: Number(item.sortOrder ?? 0),
        };
    }

    protected entityLabel(item: AfterReturnActionResponse): string {
        return item.actionDescription || item.actionCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.actionCode.trim() &&
            !!this.form.actionDescription.trim() &&
            Number.isInteger(Number(this.form.sortOrder))
        );
    }

    protected createItem(form: AfterReturnActionForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: AfterReturnActionForm) {
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

    private toPayload(form: AfterReturnActionForm): UpdateAfterReturnActionRequest {
        return {
            actionCode: form.actionCode.trim(),
            actionDescription: form.actionDescription.trim(),
            sortOrder: Number(form.sortOrder),
        };
    }
}

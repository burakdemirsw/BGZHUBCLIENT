import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsBeforeClaimInstructionsService } from '@/app/core/services/wms/wms-before-claim-instructions.service';
import {
    BeforeClaimInstructionResponse,
    UpdateBeforeClaimInstructionRequest,
} from '@/app/core/models/wms/before-claim-instruction.models';

interface ReturnInstructionForm {
    content: string;
    sortOrder: number;
}

const EMPTY_FORM: ReturnInstructionForm = {
    content: '',
    sortOrder: 0,
};

/** İçerik alanının şablondaki karakter sayacı için üst sınırı */
const CONTENT_MAX_LENGTH = 1000;

/**
 * İade bilgilendirme maddeleri — sipariş takip panelinde iade talebi öncesi
 * gösterilen "Talep Oluşturmadan Önce Bilmeniz Gerekenler" listesini yönetir.
 * Uç nokta: /api/wms/before-claim-instructions
 */
@Component({
    selector: 'app-otp-return-instructions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './return-instructions.html',
    styleUrls: ['./return-instructions.scss'],
})
export class OtpReturnInstructionsPage extends WmsCrudPage<BeforeClaimInstructionResponse, ReturnInstructionForm> {
    private readonly service = inject(WmsBeforeClaimInstructionsService);

    readonly contentMaxLength = CONTENT_MAX_LENGTH;

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<BeforeClaimInstructionResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): ReturnInstructionForm {
        return { ...EMPTY_FORM, sortOrder: this.nextSortOrder() };
    }

    protected toForm(item: BeforeClaimInstructionResponse): ReturnInstructionForm {
        return {
            content: item.content || '',
            sortOrder: Number(item.sortOrder ?? 0),
        };
    }

    protected entityLabel(item: BeforeClaimInstructionResponse): string {
        const content = item.content || '';
        return content.length > 60 ? content.slice(0, 60) + '…' : content;
    }

    get isFormValid(): boolean {
        return !!this.form.content.trim() && Number.isInteger(Number(this.form.sortOrder));
    }

    protected createItem(form: ReturnInstructionForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ReturnInstructionForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    /** Yeni madde için görüntülenen sayfadaki en büyük sıranın bir fazlası */
    private nextSortOrder(): number {
        const orders = this.pagedItems.map(item => Number(item.sortOrder ?? 0));
        return orders.length ? Math.max(...orders) + 1 : 1;
    }

    private toPayload(form: ReturnInstructionForm): UpdateBeforeClaimInstructionRequest {
        return {
            content: form.content.trim(),
            sortOrder: Number(form.sortOrder),
        };
    }
}

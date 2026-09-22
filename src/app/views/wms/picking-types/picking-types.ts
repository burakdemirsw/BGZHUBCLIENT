import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsPickingTypesService } from '@/app/core/services/wms/wms-picking-types.service';
import {
    PickingTypeResponse,
    UpdatePickingTypeRequest,
} from '@/app/core/models/wms/picking-type.models';

interface PickingTypesForm {
    pickingTypeCode: string;
    pickingTypeDescription: string;
    /** yaml'da açıklamasız integer; değer anlamları API'de tanımlı değil */
    direction: number;
    isActive: boolean;
}

const EMPTY_FORM: PickingTypesForm = {
    pickingTypeCode: '',
    pickingTypeDescription: '',
    direction: 0,
    isActive: true,
};

@Component({
    selector: 'app-wms-picking-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './picking-types.html',
    styleUrls: ['./picking-types.scss'],
})
export class WmsPickingTypesPage extends WmsCrudPage<PickingTypeResponse, PickingTypesForm> {
    private readonly service = inject(WmsPickingTypesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<PickingTypeResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): PickingTypesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: PickingTypeResponse): PickingTypesForm {
        return {
            pickingTypeCode: item.pickingTypeCode || '',
            pickingTypeDescription: item.pickingTypeDescription || '',
            direction: Number(item.direction ?? 0),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: PickingTypeResponse): string {
        return item.pickingTypeDescription || item.pickingTypeCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.pickingTypeCode.trim() &&
            !!this.form.pickingTypeDescription.trim() &&
            Number.isInteger(Number(this.form.direction))
        );
    }

    protected createItem(form: PickingTypesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: PickingTypesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: PickingTypesForm): UpdatePickingTypeRequest {
        return {
            pickingTypeCode: form.pickingTypeCode.trim(),
            pickingTypeDescription: form.pickingTypeDescription.trim(),
            direction: Number(form.direction),
            isActive: form.isActive,
        };
    }
}

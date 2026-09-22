import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsShelfCountTypesService } from '@/app/core/services/wms/wms-shelf-count-types.service';
import {
    ShelfCountTypeResponse,
    UpdateShelfCountTypeRequest,
} from '@/app/core/models/wms/shelf-count-type.models';

interface ShelfCountTypesForm {
    shelfCountTypeCode: string;
    shelfCountTypeDescription: string;
    isBlind: boolean;
    isActive: boolean;
}

const EMPTY_FORM: ShelfCountTypesForm = {
    shelfCountTypeCode: '',
    shelfCountTypeDescription: '',
    isBlind: false,
    isActive: true,
};

@Component({
    selector: 'app-wms-shelf-count-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './shelf-count-types.html',
    styleUrls: ['./shelf-count-types.scss'],
})
export class WmsShelfCountTypesPage extends WmsCrudPage<ShelfCountTypeResponse, ShelfCountTypesForm> {
    private readonly service = inject(WmsShelfCountTypesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ShelfCountTypeResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): ShelfCountTypesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: ShelfCountTypeResponse): ShelfCountTypesForm {
        return {
            shelfCountTypeCode: item.shelfCountTypeCode || '',
            shelfCountTypeDescription: item.shelfCountTypeDescription || '',
            isBlind: item.isBlind,
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ShelfCountTypeResponse): string {
        return item.shelfCountTypeDescription || item.shelfCountTypeCode || '';
    }

    get isFormValid(): boolean {
        return !!this.form.shelfCountTypeCode.trim() && !!this.form.shelfCountTypeDescription.trim();
    }

    protected createItem(form: ShelfCountTypesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ShelfCountTypesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: ShelfCountTypesForm): UpdateShelfCountTypeRequest {
        return {
            shelfCountTypeCode: form.shelfCountTypeCode.trim(),
            shelfCountTypeDescription: form.shelfCountTypeDescription.trim(),
            isBlind: form.isBlind,
            isActive: form.isActive,
        };
    }
}

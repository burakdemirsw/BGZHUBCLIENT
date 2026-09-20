import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsItemTypesService } from '@/app/core/services/wms/wms-item-types.service';
import {
    ItemTypeResponse,
    UpdateItemTypeRequest,
} from '@/app/core/models/wms/item-type.models';

interface ItemTypesForm {
    itemTypeCode: number;
    itemTypeDescription: string;
    isActive: boolean;
}

const EMPTY_FORM: ItemTypesForm = {
    itemTypeCode: 0,
    itemTypeDescription: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-item-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './item-types.html',
    styleUrls: ['./item-types.scss'],
})
export class WmsItemTypesPage extends WmsCrudPage<ItemTypeResponse, ItemTypesForm> {
    private readonly service = inject(WmsItemTypesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ItemTypeResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): ItemTypesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: ItemTypeResponse): ItemTypesForm {
        return {
            itemTypeCode: Number(item.itemTypeCode ?? 0),
            itemTypeDescription: item.itemTypeDescription || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ItemTypeResponse): string {
        return item.itemTypeDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !Number.isNaN(this.form.itemTypeCode) &&
            !!this.form.itemTypeDescription.trim()
        );
    }

    protected createItem(form: ItemTypesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ItemTypesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: ItemTypesForm): UpdateItemTypeRequest {
        return {
            itemTypeCode: form.itemTypeCode,
            itemTypeDescription: form.itemTypeDescription.trim(),
            isActive: form.isActive,
        };
    }
}

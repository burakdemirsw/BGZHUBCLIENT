import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsItemBarcodeTypesService } from '@/app/core/services/wms/wms-item-barcode-types.service';
import {
    ItemBarcodeTypeResponse,
    UpdateItemBarcodeTypeRequest,
} from '@/app/core/models/wms/item-barcode-type.models';

interface ItemBarcodeTypesForm {
    barcodeTypeCode: string;
    barcodeTypeDescription: string;
    barcodeLength: number | null;
    isActive: boolean;
}

const EMPTY_FORM: ItemBarcodeTypesForm = {
    barcodeTypeCode: '',
    barcodeTypeDescription: '',
    barcodeLength: null,
    isActive: true,
};

@Component({
    selector: 'app-wms-item-barcode-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './item-barcode-types.html',
    styleUrls: ['./item-barcode-types.scss'],
})
export class WmsItemBarcodeTypesPage extends WmsCrudPage<ItemBarcodeTypeResponse, ItemBarcodeTypesForm> {
    private readonly service = inject(WmsItemBarcodeTypesService);

    protected fetchItems(): Promise<ApiResponse<ItemBarcodeTypeResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: ItemBarcodeTypeResponse) {
        return [
            item.barcodeTypeCode,
            item.barcodeTypeDescription,
            item.barcodeLength,
        ];
    }

    protected emptyForm(): ItemBarcodeTypesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: ItemBarcodeTypeResponse): ItemBarcodeTypesForm {
        return {
            barcodeTypeCode: item.barcodeTypeCode || '',
            barcodeTypeDescription: item.barcodeTypeDescription || '',
            barcodeLength: item.barcodeLength == null ? null : Number(item.barcodeLength),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ItemBarcodeTypeResponse): string {
        return item.barcodeTypeDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.barcodeTypeCode.trim() &&
            !!this.form.barcodeTypeDescription.trim()
        );
    }

    protected createItem(form: ItemBarcodeTypesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ItemBarcodeTypesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: ItemBarcodeTypesForm): UpdateItemBarcodeTypeRequest {
        return {
            barcodeTypeCode: form.barcodeTypeCode.trim(),
            barcodeTypeDescription: form.barcodeTypeDescription.trim(),
            barcodeLength: form.barcodeLength,
            isActive: form.isActive,
        };
    }
}

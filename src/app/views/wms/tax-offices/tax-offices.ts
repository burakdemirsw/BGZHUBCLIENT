import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsTaxOfficesService } from '@/app/core/services/wms/wms-tax-offices.service';
import {
    UpdateWmsTaxOfficeRequest,
    WmsTaxOfficeResponse,
} from '@/app/core/models/wms/tax-office.models';

interface TaxOfficesForm {
    taxOfficeCode: string;
    cityCode: string;
    isActive: boolean;
}

const EMPTY_FORM: TaxOfficesForm = {
    taxOfficeCode: '',
    cityCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-tax-offices-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './tax-offices.html',
    styleUrls: ['./tax-offices.scss'],
})
export class WmsTaxOfficesPage extends WmsCrudPage<WmsTaxOfficeResponse, TaxOfficesForm> {
    private readonly service = inject(WmsTaxOfficesService);

    protected fetchItems(): Promise<ApiResponse<WmsTaxOfficeResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: WmsTaxOfficeResponse) {
        return [
            item.taxOfficeCode,
            item.cityCode,
        ];
    }

    protected emptyForm(): TaxOfficesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WmsTaxOfficeResponse): TaxOfficesForm {
        return {
            taxOfficeCode: item.taxOfficeCode || '',
            cityCode: item.cityCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WmsTaxOfficeResponse): string {
        return item.taxOfficeCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.taxOfficeCode.trim() &&
            !!this.form.cityCode.trim()
        );
    }

    protected createItem(form: TaxOfficesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: TaxOfficesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: TaxOfficesForm): UpdateWmsTaxOfficeRequest {
        return {
            taxOfficeCode: form.taxOfficeCode.trim(),
            cityCode: form.cityCode.trim(),
            isActive: form.isActive,
        };
    }
}

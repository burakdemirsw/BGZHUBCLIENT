import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsCurrenciesService } from '@/app/core/services/wms/wms-currencies.service';
import {
    CurrencyResponse,
    UpdateCurrencyRequest,
} from '@/app/core/models/wms/currency.models';

interface CurrenciesForm {
    currencyCode: string;
    isActive: boolean;
}

const EMPTY_FORM: CurrenciesForm = {
    currencyCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-currencies-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './currencies.html',
    styleUrls: ['./currencies.scss'],
})
export class WmsCurrenciesPage extends WmsCrudPage<CurrencyResponse, CurrenciesForm> {
    private readonly service = inject(WmsCurrenciesService);

    protected fetchItems(): Promise<ApiResponse<CurrencyResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: CurrencyResponse) {
        return [
            item.currencyCode,
        ];
    }

    protected emptyForm(): CurrenciesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: CurrencyResponse): CurrenciesForm {
        return {
            currencyCode: item.currencyCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: CurrencyResponse): string {
        return item.currencyCode || '';
    }

    get isFormValid(): boolean {
        return !!this.form.currencyCode.trim();
    }

    protected createItem(form: CurrenciesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: CurrenciesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: CurrenciesForm): UpdateCurrencyRequest {
        return {
            currencyCode: form.currencyCode.trim(),
            isActive: form.isActive,
        };
    }
}

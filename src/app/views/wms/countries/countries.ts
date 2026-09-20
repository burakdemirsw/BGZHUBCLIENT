import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsCountriesService } from '@/app/core/services/wms/wms-countries.service';
import {
    UpdateWmsCountryRequest,
    WmsCountryResponse,
} from '@/app/core/models/wms/location.models';

interface CountriesForm {
    countryCode: string;
    countryISOCode: string;
    isActive: boolean;
}

const EMPTY_FORM: CountriesForm = {
    countryCode: '',
    countryISOCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-countries-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './countries.html',
    styleUrls: ['./countries.scss'],
})
export class WmsCountriesPage extends WmsCrudPage<WmsCountryResponse, CountriesForm> {
    private readonly service = inject(WmsCountriesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<WmsCountryResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): CountriesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WmsCountryResponse): CountriesForm {
        return {
            countryCode: item.countryCode || '',
            countryISOCode: item.countryISOCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WmsCountryResponse): string {
        return item.countryCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.countryCode.trim() &&
            !!this.form.countryISOCode.trim()
        );
    }

    protected createItem(form: CountriesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: CountriesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: CountriesForm): UpdateWmsCountryRequest {
        return {
            countryCode: form.countryCode.trim(),
            countryISOCode: form.countryISOCode.trim(),
            isActive: form.isActive,
        };
    }
}

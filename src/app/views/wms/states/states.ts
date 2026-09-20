import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsStatesService } from '@/app/core/services/wms/wms-states.service';
import { WmsCountriesService } from '@/app/core/services/wms/wms-countries.service';
import {
    UpdateWmsStateRequest,
    WmsCountryResponse,
    WmsStateResponse,
} from '@/app/core/models/wms/location.models';

interface StatesForm {
    stateCode: string;
    countryCode: string;
    isActive: boolean;
}

const EMPTY_FORM: StatesForm = {
    stateCode: '',
    countryCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-states-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './states.html',
    styleUrls: ['./states.scss'],
})
export class WmsStatesPage extends WmsCrudPage<WmsStateResponse, StatesForm> {
    private readonly service = inject(WmsStatesService);
    private readonly countriesService = inject(WmsCountriesService);

    countries: WmsCountryResponse[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchItems(): Promise<ApiResponse<WmsStateResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: WmsStateResponse) {
        return [
            item.stateCode,
            item.countryCode,
        ];
    }

    protected emptyForm(): StatesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WmsStateResponse): StatesForm {
        return {
            stateCode: item.stateCode || '',
            countryCode: item.countryCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WmsStateResponse): string {
        return item.stateCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.stateCode.trim() &&
            !!this.form.countryCode.trim()
        );
    }

    protected createItem(form: StatesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: StatesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: StatesForm): UpdateWmsStateRequest {
        return {
            stateCode: form.stateCode.trim(),
            countryCode: form.countryCode.trim(),
            isActive: form.isActive,
        };
    }

    /** Formdaki seçim listeleri */
    private async loadLookups(): Promise<void> {
        try {
            const response = await this.countriesService.getAll();
            this.countries = this.extractArray<WmsCountryResponse>(response?.data);
        } catch (err) {
            console.error('Bölgeler: seçim listeleri yüklenemedi:', err);
        }
    }
}

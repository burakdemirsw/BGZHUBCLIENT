import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsCitiesService } from '@/app/core/services/wms/wms-cities.service';
import { WmsStatesService } from '@/app/core/services/wms/wms-states.service';
import {
    UpdateWmsCityRequest,
    WmsCityResponse,
    WmsStateResponse,
} from '@/app/core/models/wms/location.models';

interface CitiesForm {
    cityCode: string;
    stateCode: string;
    isActive: boolean;
}

const EMPTY_FORM: CitiesForm = {
    cityCode: '',
    stateCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-cities-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './cities.html',
    styleUrls: ['./cities.scss'],
})
export class WmsCitiesPage extends WmsCrudPage<WmsCityResponse, CitiesForm> {
    private readonly service = inject(WmsCitiesService);
    private readonly statesService = inject(WmsStatesService);

    states: WmsStateResponse[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchItems(): Promise<ApiResponse<WmsCityResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: WmsCityResponse) {
        return [
            item.cityCode,
            item.stateCode,
        ];
    }

    protected emptyForm(): CitiesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WmsCityResponse): CitiesForm {
        return {
            cityCode: item.cityCode || '',
            stateCode: item.stateCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WmsCityResponse): string {
        return item.cityCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.cityCode.trim() &&
            !!this.form.stateCode.trim()
        );
    }

    protected createItem(form: CitiesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: CitiesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: CitiesForm): UpdateWmsCityRequest {
        return {
            cityCode: form.cityCode.trim(),
            stateCode: form.stateCode.trim(),
            isActive: form.isActive,
        };
    }

    /** Formdaki seçim listeleri */
    private async loadLookups(): Promise<void> {
        try {
            const response = await this.statesService.getAll();
            this.states = this.extractArray<WmsStateResponse>(response?.data);
        } catch (err) {
            console.error('İller: seçim listeleri yüklenemedi:', err);
        }
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsDistrictsService } from '@/app/core/services/wms/wms-districts.service';
import { WmsCitiesService } from '@/app/core/services/wms/wms-cities.service';
import {
    UpdateWmsDistrictRequest,
    WmsCityResponse,
    WmsDistrictResponse,
} from '@/app/core/models/wms/location.models';

interface DistrictsForm {
    districtCode: string;
    cityCode: string;
    isActive: boolean;
}

const EMPTY_FORM: DistrictsForm = {
    districtCode: '',
    cityCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-districts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './districts.html',
    styleUrls: ['./districts.scss'],
})
export class WmsDistrictsPage extends WmsCrudPage<WmsDistrictResponse, DistrictsForm> {
    private readonly service = inject(WmsDistrictsService);
    private readonly citiesService = inject(WmsCitiesService);

    cities: WmsCityResponse[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchItems(): Promise<ApiResponse<WmsDistrictResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: WmsDistrictResponse) {
        return [
            item.districtCode,
            item.cityCode,
        ];
    }

    protected emptyForm(): DistrictsForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WmsDistrictResponse): DistrictsForm {
        return {
            districtCode: item.districtCode || '',
            cityCode: item.cityCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WmsDistrictResponse): string {
        return item.districtCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.districtCode.trim() &&
            !!this.form.cityCode.trim()
        );
    }

    protected createItem(form: DistrictsForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: DistrictsForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: DistrictsForm): UpdateWmsDistrictRequest {
        return {
            districtCode: form.districtCode.trim(),
            cityCode: form.cityCode.trim(),
            isActive: form.isActive,
        };
    }

    /** Formdaki seçim listeleri */
    private async loadLookups(): Promise<void> {
        try {
            const response = await this.citiesService.getAll();
            this.cities = this.extractArray<WmsCityResponse>(response?.data);
        } catch (err) {
            console.error('İlçeler: seçim listeleri yüklenemedi:', err);
        }
    }
}

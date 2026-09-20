import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsStoresService } from '@/app/core/services/wms/wms-stores.service';
import { WmsOfficesService } from '@/app/core/services/wms/wms-offices.service';
import { OfficeResponse } from '@/app/core/models/wms/office.models';
import {
    StoreResponse,
    UpdateStoreRequest,
} from '@/app/core/models/wms/store.models';

interface StoresForm {
    storeCode: string;
    storeDescription: string;
    officeCode: string;
    customerTypeCode: number;
    customerCode: string;
    phone: string;
    email: string;
    isActive: boolean;
}

const EMPTY_FORM: StoresForm = {
    storeCode: '',
    storeDescription: '',
    officeCode: '',
    customerTypeCode: 0,
    customerCode: '',
    phone: '',
    email: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-stores-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './stores.html',
    styleUrls: ['./stores.scss'],
})
export class WmsStoresPage extends WmsCrudPage<StoreResponse, StoresForm> {
    private readonly service = inject(WmsStoresService);
    private readonly officesService = inject(WmsOfficesService);

    offices: OfficeResponse[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchItems(): Promise<ApiResponse<StoreResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: StoreResponse) {
        return [
            item.storeCode,
            item.storeDescription,
            item.officeCode,
            item.customerCode,
            item.phone,
        ];
    }

    protected emptyForm(): StoresForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: StoreResponse): StoresForm {
        return {
            storeCode: item.storeCode || '',
            storeDescription: item.storeDescription || '',
            officeCode: item.officeCode || '',
            customerTypeCode: Number(item.customerTypeCode ?? 0),
            customerCode: item.customerCode || '',
            phone: item.phone || '',
            email: item.email || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: StoreResponse): string {
        return item.storeDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.storeCode.trim() &&
            !!this.form.storeDescription.trim() &&
            !!this.form.officeCode.trim() &&
            !Number.isNaN(this.form.customerTypeCode)
        );
    }

    protected createItem(form: StoresForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: StoresForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: StoresForm): UpdateStoreRequest {
        return {
            storeCode: form.storeCode.trim(),
            storeDescription: form.storeDescription.trim(),
            officeCode: form.officeCode.trim(),
            customerTypeCode: form.customerTypeCode,
            customerCode: form.customerCode.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            isActive: form.isActive,
        };
    }

    /** Formdaki seçim listeleri */
    private async loadLookups(): Promise<void> {
        try {
            const response = await this.officesService.getAll();
            this.offices = this.extractArray<OfficeResponse>(response?.data);
        } catch (err) {
            console.error('Mağazalar: seçim listeleri yüklenemedi:', err);
        }
    }
}

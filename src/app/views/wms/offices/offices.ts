import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsOfficesService } from '@/app/core/services/wms/wms-offices.service';
import {
    OfficeResponse,
    UpdateOfficeRequest,
} from '@/app/core/models/wms/office.models';

interface OfficesForm {
    officeCode: string;
    officeDescription: string;
    phone: string;
    email: string;
    isActive: boolean;
}

const EMPTY_FORM: OfficesForm = {
    officeCode: '',
    officeDescription: '',
    phone: '',
    email: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-offices-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './offices.html',
    styleUrls: ['./offices.scss'],
})
export class WmsOfficesPage extends WmsCrudPage<OfficeResponse, OfficesForm> {
    private readonly service = inject(WmsOfficesService);

    protected fetchItems(): Promise<ApiResponse<OfficeResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: OfficeResponse) {
        return [
            item.officeCode,
            item.officeDescription,
            item.phone,
            item.email,
        ];
    }

    protected emptyForm(): OfficesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: OfficeResponse): OfficesForm {
        return {
            officeCode: item.officeCode || '',
            officeDescription: item.officeDescription || '',
            phone: item.phone || '',
            email: item.email || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: OfficeResponse): string {
        return item.officeDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.officeCode.trim() &&
            !!this.form.officeDescription.trim()
        );
    }

    protected createItem(form: OfficesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: OfficesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: OfficesForm): UpdateOfficeRequest {
        return {
            officeCode: form.officeCode.trim(),
            officeDescription: form.officeDescription.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            isActive: form.isActive,
        };
    }
}

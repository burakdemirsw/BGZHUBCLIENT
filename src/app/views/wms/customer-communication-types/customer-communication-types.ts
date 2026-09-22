import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsCustomerCommunicationTypesService } from '@/app/core/services/wms/wms-customer-communication-types.service';
import {
    CustomerCommunicationTypeResponse,
    UpdateCustomerCommunicationTypeRequest,
} from '@/app/core/models/wms/customer-communication-type.models';

interface CustomerCommunicationTypesForm {
    communicationTypeCode: number;
    communicationTypeDescription: string;
    isActive: boolean;
}

const EMPTY_FORM: CustomerCommunicationTypesForm = {
    communicationTypeCode: 0,
    communicationTypeDescription: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-customer-communication-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './customer-communication-types.html',
    styleUrls: ['./customer-communication-types.scss'],
})
export class WmsCustomerCommunicationTypesPage extends WmsCrudPage<CustomerCommunicationTypeResponse, CustomerCommunicationTypesForm> {
    private readonly service = inject(WmsCustomerCommunicationTypesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<CustomerCommunicationTypeResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): CustomerCommunicationTypesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: CustomerCommunicationTypeResponse): CustomerCommunicationTypesForm {
        return {
            communicationTypeCode: Number(item.communicationTypeCode ?? 0),
            communicationTypeDescription: item.communicationTypeDescription || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: CustomerCommunicationTypeResponse): string {
        return item.communicationTypeDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !Number.isNaN(this.form.communicationTypeCode) &&
            !!this.form.communicationTypeDescription.trim()
        );
    }

    protected createItem(form: CustomerCommunicationTypesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: CustomerCommunicationTypesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: CustomerCommunicationTypesForm): UpdateCustomerCommunicationTypeRequest {
        return {
            communicationTypeCode: form.communicationTypeCode,
            communicationTypeDescription: form.communicationTypeDescription.trim(),
            isActive: form.isActive,
        };
    }
}

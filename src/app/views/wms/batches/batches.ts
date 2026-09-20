import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsBatchesService } from '@/app/core/services/wms/wms-batches.service';
import {
    BatchResponse,
    UpdateBatchRequest,
} from '@/app/core/models/wms/batch.models';

interface BatchesForm {
    batchCode: string;
    isActive: boolean;
}

const EMPTY_FORM: BatchesForm = {
    batchCode: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-batches-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './batches.html',
    styleUrls: ['./batches.scss'],
})
export class WmsBatchesPage extends WmsCrudPage<BatchResponse, BatchesForm> {
    private readonly service = inject(WmsBatchesService);

    protected fetchItems(): Promise<ApiResponse<BatchResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: BatchResponse) {
        return [
            item.batchCode,
        ];
    }

    protected emptyForm(): BatchesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: BatchResponse): BatchesForm {
        return {
            batchCode: item.batchCode || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: BatchResponse): string {
        return item.batchCode || '';
    }

    get isFormValid(): boolean {
        return !!this.form.batchCode.trim();
    }

    protected createItem(form: BatchesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: BatchesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: BatchesForm): UpdateBatchRequest {
        return {
            batchCode: form.batchCode.trim(),
            isActive: form.isActive,
        };
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsWarehouseTypesService } from '@/app/core/services/wms/wms-warehouse-types.service';
import {
    UpdateWarehouseTypeRequest,
    WarehouseTypeResponse,
} from '@/app/core/models/wms/warehouse.models';

interface WarehouseTypesForm {
    warehouseTypeCode: number;
    warehouseTypeDescription: string;
    isActive: boolean;
}

const EMPTY_FORM: WarehouseTypesForm = {
    warehouseTypeCode: 0,
    warehouseTypeDescription: '',
    isActive: true,
};

@Component({
    selector: 'app-wms-warehouse-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './warehouse-types.html',
    styleUrls: ['./warehouse-types.scss'],
})
export class WmsWarehouseTypesPage extends WmsCrudPage<WarehouseTypeResponse, WarehouseTypesForm> {
    private readonly service = inject(WmsWarehouseTypesService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<WarehouseTypeResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): WarehouseTypesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WarehouseTypeResponse): WarehouseTypesForm {
        return {
            warehouseTypeCode: Number(item.warehouseTypeCode ?? 0),
            warehouseTypeDescription: item.warehouseTypeDescription || '',
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WarehouseTypeResponse): string {
        return item.warehouseTypeDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !Number.isNaN(this.form.warehouseTypeCode) &&
            !!this.form.warehouseTypeDescription.trim()
        );
    }

    protected createItem(form: WarehouseTypesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: WarehouseTypesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: WarehouseTypesForm): UpdateWarehouseTypeRequest {
        return {
            warehouseTypeCode: form.warehouseTypeCode,
            warehouseTypeDescription: form.warehouseTypeDescription.trim(),
            isActive: form.isActive,
        };
    }
}

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsWarehousesService } from '@/app/core/services/wms/wms-warehouses.service';
import { WmsWarehouseTypesService } from '@/app/core/services/wms/wms-warehouse-types.service';
import { WmsOfficesService } from '@/app/core/services/wms/wms-offices.service';
import { OfficeResponse } from '@/app/core/models/wms/office.models';
import {
    UpdateWarehouseRequest,
    WarehouseResponse,
    WarehouseTypeResponse,
} from '@/app/core/models/wms/warehouse.models';

interface WarehouseForm {
    officeCode: string;
    warehouseDescription: string;
    warehouseTypeCode: string;
    isDefault: boolean;
    isActive: boolean;
}

const EMPTY_FORM: WarehouseForm = {
    officeCode: '',
    warehouseDescription: '',
    warehouseTypeCode: '',
    isDefault: false,
    isActive: true,
};

@Component({
    selector: 'app-wms-warehouses-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './warehouses.html',
    styleUrls: ['./warehouses.scss'],
})
export class WmsWarehousesPage extends WmsCrudPage<WarehouseResponse, WarehouseForm> {
    private readonly service = inject(WmsWarehousesService);
    private readonly warehouseTypesService = inject(WmsWarehouseTypesService);
    private readonly officesService = inject(WmsOfficesService);

    warehouseTypes: WarehouseTypeResponse[] = [];
    offices: OfficeResponse[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<WarehouseResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): WarehouseForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: WarehouseResponse): WarehouseForm {
        return {
            officeCode: item.officeCode || '',
            warehouseDescription: item.warehouseDescription || '',
            warehouseTypeCode: String(item.warehouseTypeCode ?? ''),
            isDefault: item.isDefault,
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: WarehouseResponse): string {
        return item.warehouseDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.officeCode.trim() &&
            !!this.form.warehouseDescription.trim() &&
            this.form.warehouseTypeCode !== ''
        );
    }

    protected createItem(form: WarehouseForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: WarehouseForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: WarehouseForm): UpdateWarehouseRequest {
        return {
            officeCode: form.officeCode.trim(),
            warehouseDescription: form.warehouseDescription.trim(),
            warehouseTypeCode: Number(form.warehouseTypeCode),
            isDefault: form.isDefault,
            isActive: form.isActive,
        };
    }

    /** Depo tipi kodunu listede okunur açıklamaya çevirir */
    warehouseTypeLabel(code: string | number | null | undefined): string {
        const match = this.warehouseTypes.find(t => String(t.warehouseTypeCode) === String(code));
        return match?.warehouseTypeDescription || String(code ?? '—');
    }

    officeLabel(item: WarehouseResponse): string {
        return item.officeDescription || item.officeCode || '—';
    }

    /** Formdaki seçim listeleri */
    private async loadLookups(): Promise<void> {
        try {
            const [warehouseTypeItems, officeItems] = await Promise.all([
                this.warehouseTypesService.getLookupItems(),
                this.officesService.getLookupItems(),
            ]);
            this.warehouseTypes = warehouseTypeItems;
            this.offices = officeItems;
        } catch (err) {
            console.error('Depolar: seçim listeleri yüklenemedi:', err);
        }
    }
}

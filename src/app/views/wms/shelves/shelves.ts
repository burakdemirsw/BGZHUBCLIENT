import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsShelvesService } from '@/app/core/services/wms/wms-shelves.service';
import { WmsWarehousesService } from '@/app/core/services/wms/wms-warehouses.service';
import { WmsOfficesService } from '@/app/core/services/wms/wms-offices.service';
import { OfficeResponse } from '@/app/core/models/wms/office.models';
import {
    ShelfResponse,
    UpdateShelfRequest,
} from '@/app/core/models/wms/shelf.models';
import { WarehouseResponse } from '@/app/core/models/wms/warehouse.models';

interface ShelvesForm {
    officeCode: string;
    warehouseCode: string;
    shelfCode: string;
    shelfDescription: string;
    shelfBarcode: string;
    parentShelfCode: string;
    zone: string;
    aisle: string;
    bay: string;
    shelfLevel: string;
    pickSequence: number | null;
    capacity: number | null;
    maxWeight: number | null;
    isActive: boolean;
}

const EMPTY_FORM: ShelvesForm = {
    officeCode: '',
    warehouseCode: '',
    shelfCode: '',
    shelfDescription: '',
    shelfBarcode: '',
    parentShelfCode: '',
    zone: '',
    aisle: '',
    bay: '',
    shelfLevel: '',
    pickSequence: null,
    capacity: null,
    maxWeight: null,
    isActive: true,
};

@Component({
    selector: 'app-wms-shelves-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './shelves.html',
    styleUrls: ['./shelves.scss'],
})
export class WmsShelvesPage extends WmsCrudPage<ShelfResponse, ShelvesForm> {
    private readonly service = inject(WmsShelvesService);
    private readonly warehousesService = inject(WmsWarehousesService);
    private readonly officesService = inject(WmsOfficesService);

    warehouses: WarehouseResponse[] = [];
    offices: OfficeResponse[] = [];

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchItems(): Promise<ApiResponse<ShelfResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: ShelfResponse) {
        return [
            item.shelfCode,
            item.shelfDescription,
            item.warehouseCode,
            item.zone,
            item.aisle,
            item.shelfLevel,
        ];
    }

    protected emptyForm(): ShelvesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: ShelfResponse): ShelvesForm {
        return {
            officeCode: item.officeCode || '',
            warehouseCode: item.warehouseCode || '',
            shelfCode: item.shelfCode || '',
            shelfDescription: item.shelfDescription || '',
            shelfBarcode: item.shelfBarcode || '',
            parentShelfCode: item.parentShelfCode || '',
            zone: item.zone || '',
            aisle: item.aisle || '',
            bay: item.bay || '',
            shelfLevel: item.shelfLevel || '',
            pickSequence: item.pickSequence == null ? null : Number(item.pickSequence),
            capacity: item.capacity == null ? null : Number(item.capacity),
            maxWeight: item.maxWeight == null ? null : Number(item.maxWeight),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ShelfResponse): string {
        return item.shelfDescription || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.officeCode.trim() &&
            !!this.form.warehouseCode.trim() &&
            !!this.form.shelfCode.trim() &&
            !!this.form.shelfDescription.trim()
        );
    }

    protected createItem(form: ShelvesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ShelvesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: ShelvesForm): UpdateShelfRequest {
        return {
            officeCode: form.officeCode.trim(),
            warehouseCode: form.warehouseCode.trim(),
            shelfCode: form.shelfCode.trim(),
            shelfDescription: form.shelfDescription.trim(),
            shelfBarcode: form.shelfBarcode.trim() || null,
            parentShelfCode: form.parentShelfCode.trim() || null,
            zone: form.zone.trim() || null,
            aisle: form.aisle.trim() || null,
            bay: form.bay.trim() || null,
            shelfLevel: form.shelfLevel.trim() || null,
            pickSequence: form.pickSequence,
            capacity: form.capacity,
            maxWeight: form.maxWeight,
            isActive: form.isActive,
        };
    }

    /** Formdaki seçim listeleri */
    private async loadLookups(): Promise<void> {
        try {
            const [warehousesResponse, officesResponse] = await Promise.all([
                this.warehousesService.getAll(),
                this.officesService.getAll(),
            ]);
            this.warehouses = this.extractArray<WarehouseResponse>(warehousesResponse?.data);
            this.offices = this.extractArray<OfficeResponse>(officesResponse?.data);
        } catch (err) {
            console.error('Raflar: seçim listeleri yüklenemedi:', err);
        }
    }
}

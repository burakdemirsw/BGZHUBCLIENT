import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsColorsService } from '@/app/core/services/wms/wms-colors.service';
import {
    ColorResponse,
    UpdateColorRequest,
} from '@/app/core/models/wms/color.models';

interface ColorsForm {
    colorCode: string;
    sortOrder: number;
    isActive: boolean;
}

const EMPTY_FORM: ColorsForm = {
    colorCode: '',
    sortOrder: 0,
    isActive: true,
};

@Component({
    selector: 'app-wms-colors-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './colors.html',
    styleUrls: ['./colors.scss'],
})
export class WmsColorsPage extends WmsCrudPage<ColorResponse, ColorsForm> {
    private readonly service = inject(WmsColorsService);

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ColorResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): ColorsForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: ColorResponse): ColorsForm {
        return {
            colorCode: item.colorCode || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ColorResponse): string {
        return item.colorCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.colorCode.trim() &&
            !Number.isNaN(this.form.sortOrder)
        );
    }

    protected createItem(form: ColorsForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ColorsForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: ColorsForm): UpdateColorRequest {
        return {
            colorCode: form.colorCode.trim(),
            sortOrder: form.sortOrder,
            isActive: form.isActive,
        };
    }
}

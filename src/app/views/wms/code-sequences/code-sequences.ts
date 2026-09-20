import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsCodeSequencesService } from '@/app/core/services/wms/wms-code-sequences.service';
import {
    CodeSequenceResponse,
    UpdateCodeSequenceRequest,
} from '@/app/core/models/wms/code-sequence.models';

interface CodeSequencesForm {
    sequenceCode: string;
    lastNumber: number;
}

const EMPTY_FORM: CodeSequencesForm = {
    sequenceCode: '',
    lastNumber: 0,
};

@Component({
    selector: 'app-wms-code-sequences-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './code-sequences.html',
    styleUrls: ['./code-sequences.scss'],
})
export class WmsCodeSequencesPage extends WmsCrudPage<CodeSequenceResponse, CodeSequencesForm> {
    private readonly service = inject(WmsCodeSequencesService);

    protected fetchItems(): Promise<ApiResponse<CodeSequenceResponse[]>> {
        return this.service.getAll();
    }

    protected filterFields(item: CodeSequenceResponse) {
        return [
            item.sequenceCode,
            item.lastNumber,
        ];
    }

    protected emptyForm(): CodeSequencesForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: CodeSequenceResponse): CodeSequencesForm {
        return {
            sequenceCode: item.sequenceCode || '',
            lastNumber: Number(item.lastNumber ?? 0),
        };
    }

    protected entityLabel(item: CodeSequenceResponse): string {
        return item.sequenceCode || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.sequenceCode.trim() &&
            !Number.isNaN(this.form.lastNumber)
        );
    }

    protected createItem(form: CodeSequencesForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: CodeSequencesForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: CodeSequencesForm): UpdateCodeSequenceRequest {
        return {
            sequenceCode: form.sequenceCode.trim(),
            lastNumber: form.lastNumber,
        };
    }
}

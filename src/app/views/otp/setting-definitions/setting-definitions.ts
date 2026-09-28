import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsOrderTrackingSettingDefinitionsService } from '@/app/core/services/wms/wms-order-tracking-setting-definitions.service';
import {
    OrderTrackingSettingDefinitionResponse,
    UpdateOrderTrackingSettingDefinitionRequest,
} from '@/app/core/models/wms/order-tracking-setting-definition.models';

interface SettingDefinitionForm {
    settingKey: string;
    displayName: string;
    description: string;
    dataType: string;
    inputType: string;
    isRequired: boolean;
    placeholder: string;
    defaultValue: string;
    sortOrder: number;
    isActive: boolean;
}

const EMPTY_FORM: SettingDefinitionForm = {
    settingKey: '',
    displayName: '',
    description: '',
    dataType: 'string',
    inputType: 'text',
    isRequired: false,
    placeholder: '',
    defaultValue: '',
    sortOrder: 0,
    isActive: true,
};

/**
 * Sipariş takip (OTP) ayar tanımları — şirketten bağımsız şablon listesi.
 * Şirketler bu tanımlardaki anahtarlara /otp/settings sayfasından değer verir.
 */
@Component({
    selector: 'app-otp-setting-definitions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './setting-definitions.html',
    styleUrls: ['./setting-definitions.scss'],
})
export class OtpSettingDefinitionsPage extends WmsCrudPage<OrderTrackingSettingDefinitionResponse, SettingDefinitionForm> {
    private readonly service = inject(WmsOrderTrackingSettingDefinitionsService);

    /** yaml'da serbest metin; sık kullanılan değerler öneri olarak sunulur */
    readonly dataTypeSuggestions = ['string', 'int', 'decimal', 'bool', 'json', 'date'];
    readonly inputTypeSuggestions = ['text', 'textarea', 'number', 'checkbox', 'select', 'password', 'color', 'url'];

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<OrderTrackingSettingDefinitionResponse>> {
        return this.service.getPaged(request);
    }

    protected emptyForm(): SettingDefinitionForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: OrderTrackingSettingDefinitionResponse): SettingDefinitionForm {
        return {
            settingKey: item.settingKey || '',
            displayName: item.displayName || '',
            description: item.description || '',
            dataType: item.dataType || '',
            inputType: item.inputType || '',
            isRequired: item.isRequired,
            placeholder: item.placeholder || '',
            defaultValue: item.defaultValue || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: OrderTrackingSettingDefinitionResponse): string {
        return item.displayName || item.settingKey || '';
    }

    get isFormValid(): boolean {
        return (
            !!this.form.settingKey.trim() &&
            !!this.form.displayName.trim() &&
            Number.isInteger(Number(this.form.sortOrder))
        );
    }

    protected createItem(form: SettingDefinitionForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: SettingDefinitionForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: SettingDefinitionForm): UpdateOrderTrackingSettingDefinitionRequest {
        return {
            settingKey: form.settingKey.trim(),
            displayName: form.displayName.trim(),
            description: form.description.trim(),
            dataType: form.dataType.trim(),
            inputType: form.inputType.trim(),
            isRequired: form.isRequired,
            placeholder: form.placeholder.trim(),
            defaultValue: form.defaultValue.trim(),
            sortOrder: Number(form.sortOrder),
            isActive: form.isActive,
        };
    }
}

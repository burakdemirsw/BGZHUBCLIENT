import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsOrderTrackingSettingsService } from '@/app/core/services/wms/wms-order-tracking-settings.service';
import { WmsOrderTrackingSettingDefinitionsService } from '@/app/core/services/wms/wms-order-tracking-setting-definitions.service';
import {
    OrderTrackingSettingResponse,
    UpdateOrderTrackingSettingRequest,
} from '@/app/core/models/wms/order-tracking-setting.models';
import { OrderTrackingSettingDefinitionResponse } from '@/app/core/models/wms/order-tracking-setting-definition.models';

interface SettingForm {
    settingKey: string;
    settingValue: string;
}

const EMPTY_FORM: SettingForm = {
    settingKey: '',
    settingValue: '',
};

/** Değer alanının `checkbox` olarak sunulacağı giriş tipleri */
const BOOLEAN_INPUT_TYPES = ['checkbox', 'bool', 'boolean', 'switch'];

/** Listede değeri açık gösterilmeyecek anahtarlar (parola, gizli anahtar vb.) */
const SECRET_KEY_HINTS = ['password', 'secret', 'token', 'apikey', 'api_key', 'parola', 'sifre'];

/**
 * Sipariş takip (OTP) şirket ayarları.
 * Her kayıt, ayar tanımlarındaki bir anahtara şirketin verdiği değeri tutar;
 * anahtar listesi /otp/setting-definitions sayfasındaki aktif tanımlardan gelir.
 */
@Component({
    selector: 'app-otp-settings-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.html',
    styleUrls: ['./settings.scss'],
})
export class OtpSettingsPage extends WmsCrudPage<OrderTrackingSettingResponse, SettingForm> {
    private readonly service = inject(WmsOrderTrackingSettingsService);
    private readonly definitionsService = inject(WmsOrderTrackingSettingDefinitionsService);

    /** Anahtar seçimi için aktif tanımlar */
    definitions: OrderTrackingSettingDefinitionResponse[] = [];
    definitionsLoading = false;

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadDefinitions();
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<OrderTrackingSettingResponse>> {
        return this.service.getPaged(request);
    }

    /** Anahtar açıklamalarını gösterebilmek için tanımlar tek seferde çekilir */
    private async loadDefinitions(): Promise<void> {
        this.definitionsLoading = true;
        try {
            const items = await this.definitionsService.getLookupItems();
            this.definitions = items
                .filter(definition => definition.isActive)
                .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0));
        } catch (err) {
            console.error('OTP ayar tanımları yüklenemedi:', err);
            this.definitions = [];
        } finally {
            this.definitionsLoading = false;
        }
    }

    /** Parola benzeri ayarların değeri listede maskelenir */
    isSecret(settingKey: string | null): boolean {
        const key = (settingKey || '').toLowerCase();
        const inputType = (this.definitionOf(settingKey)?.inputType || '').toLowerCase();
        return inputType === 'password' || SECRET_KEY_HINTS.some(hint => key.includes(hint));
    }

    /** Listede gösterilecek değer — gizli ayarlarda maskelenir */
    displayValueOf(item: OrderTrackingSettingResponse): string {
        if (!item.settingValue) return '—';
        return this.isSecret(item.settingKey) ? '••••••••' : item.settingValue;
    }

    /** Listedeki anahtarın tanımı — yoksa tanım silinmiş/pasif demektir */
    definitionOf(settingKey: string | null): OrderTrackingSettingDefinitionResponse | null {
        if (!settingKey) return null;
        return this.definitions.find(definition => definition.settingKey === settingKey) ?? null;
    }

    displayNameOf(settingKey: string | null): string {
        return this.definitionOf(settingKey)?.displayName || settingKey || '—';
    }

    /** Formda seçili anahtarın tanımı — alan tipi ve ipucu buradan gelir */
    get selectedDefinition(): OrderTrackingSettingDefinitionResponse | null {
        return this.definitionOf(this.form.settingKey);
    }

    get isBooleanValue(): boolean {
        const inputType = (this.selectedDefinition?.inputType || '').toLowerCase();
        return BOOLEAN_INPUT_TYPES.includes(inputType);
    }

    get isNumberValue(): boolean {
        const inputType = (this.selectedDefinition?.inputType || '').toLowerCase();
        const dataType = (this.selectedDefinition?.dataType || '').toLowerCase();
        return inputType === 'number' || dataType === 'int' || dataType === 'decimal';
    }

    get isTextareaValue(): boolean {
        return (this.selectedDefinition?.inputType || '').toLowerCase() === 'textarea';
    }

    get booleanValue(): boolean {
        return this.form.settingValue === 'true';
    }

    setBooleanValue(checked: boolean): void {
        this.form.settingValue = checked ? 'true' : 'false';
    }

    /**
     * Anahtar değişince, tanımda varsayılan değer varsa ve alan boşsa
     * varsayılan değer forma yazılır.
     */
    onSettingKeyChange(): void {
        const definition = this.selectedDefinition;
        if (definition?.defaultValue && !this.form.settingValue.trim()) {
            this.form.settingValue = definition.defaultValue;
        }
    }

    /** Aynı anahtar için ikinci kayıt açılmasın — düzenlemede mevcut anahtar serbest */
    isKeyUsed(settingKey: string | null): boolean {
        if (!settingKey) return false;
        if (this.editMode && this.selectedItem?.settingKey === settingKey) return false;
        return this.pagedItems.some(item => item.settingKey === settingKey);
    }

    protected emptyForm(): SettingForm {
        return { ...EMPTY_FORM };
    }

    protected toForm(item: OrderTrackingSettingResponse): SettingForm {
        return {
            settingKey: item.settingKey || '',
            settingValue: item.settingValue || '',
        };
    }

    protected entityLabel(item: OrderTrackingSettingResponse): string {
        return this.displayNameOf(item.settingKey);
    }

    get isFormValid(): boolean {
        if (!this.form.settingKey.trim()) return false;
        if (this.isKeyUsed(this.form.settingKey)) return false;
        // Tanım zorunlu diyorsa değer boş bırakılamaz
        if (this.selectedDefinition?.isRequired && !this.form.settingValue.trim()) return false;
        return true;
    }

    protected createItem(form: SettingForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: SettingForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    private toPayload(form: SettingForm): UpdateOrderTrackingSettingRequest {
        return {
            settingKey: form.settingKey.trim(),
            settingValue: form.settingValue.trim(),
        };
    }
}

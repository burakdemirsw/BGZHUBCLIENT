import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsCrudPage } from '@/app/views/wms/shared/wms-crud-page';
import { WmsClaimCargoCompaniesService } from '@/app/core/services/wms/wms-claim-cargo-companies.service';
import { ExtensionManagementService } from '@/app/core/services/extension-management.service';
import {
    ClaimCargoCompanyResponse,
    UpdateClaimCargoCompanyRequest,
} from '@/app/core/models/wms/claim-cargo-company.models';
import { ExtensionDefinition } from '@/app/core/models/extension/extension-definition.models';

interface ClaimCargoCompanyForm {
    cargoExtensionId: string;
    customerNo: string;
    accountTitle: string;
    sortOrder: number;
    isActive: boolean;
}

const EMPTY_FORM: ClaimCargoCompanyForm = {
    cargoExtensionId: '',
    customerNo: '',
    accountTitle: '',
    sortOrder: 0,
    isActive: true,
};

/**
 * İade kargo şirketleri — sipariş takip panelinde iade talebinin 3. adımında
 * müşteriye gösterilen kargo listesini yönetir.
 * Uç nokta: /api/wms/claim-cargo-companies
 */
@Component({
    selector: 'app-otp-claim-cargo-companies-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './claim-cargo-companies.html',
    styleUrls: ['./claim-cargo-companies.scss'],
})
export class OtpClaimCargoCompaniesPage extends WmsCrudPage<ClaimCargoCompanyResponse, ClaimCargoCompanyForm> {
    private readonly service = inject(WmsClaimCargoCompaniesService);
    private readonly extensionService = inject(ExtensionManagementService);

    /** `cargoExtensionId` seçimi için eklenti tanımları */
    definitions: ExtensionDefinition[] = [];
    lookupsLoading = false;

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadLookups();
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<ClaimCargoCompanyResponse>> {
        return this.service.getPaged(request);
    }

    /** Kargo entegrasyonu seçim listesi — eklenti tanımları (global) */
    private async loadLookups(): Promise<void> {
        this.lookupsLoading = true;
        try {
            const response = await this.extensionService.getExtensionDefinitions();
            this.definitions = this.extractArray<ExtensionDefinition>(response)
                .filter(definition => definition.isActive)
                .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
        } catch (err) {
            console.error('Eklenti tanımları yüklenemedi:', err);
            this.definitions = [];
        } finally {
            this.lookupsLoading = false;
        }
    }

    /** Eklenti tanımının adı — teknik kimlik ekranda gösterilmez */
    extensionName(extensionId: string | null): string {
        if (!extensionId) return '—';
        return this.definitions.find(definition => definition.id === extensionId)?.name || 'Tanımsız eklenti';
    }

    protected emptyForm(): ClaimCargoCompanyForm {
        return { ...EMPTY_FORM, sortOrder: this.nextSortOrder() };
    }

    protected toForm(item: ClaimCargoCompanyResponse): ClaimCargoCompanyForm {
        return {
            cargoExtensionId: item.cargoExtensionId || '',
            customerNo: item.customerNo || '',
            accountTitle: item.accountTitle || '',
            sortOrder: Number(item.sortOrder ?? 0),
            isActive: item.isActive,
        };
    }

    protected entityLabel(item: ClaimCargoCompanyResponse): string {
        return item.accountTitle || this.extensionName(item.cargoExtensionId);
    }

    get isFormValid(): boolean {
        return (
            !!this.form.customerNo.trim() &&
            !!this.form.accountTitle.trim() &&
            Number.isInteger(Number(this.form.sortOrder))
        );
    }

    protected createItem(form: ClaimCargoCompanyForm) {
        return this.service.create(this.toPayload(form));
    }

    protected updateItem(id: string, form: ClaimCargoCompanyForm) {
        return this.service.update(id, this.toPayload(form));
    }

    protected deleteRequest(id: string) {
        return this.service.delete(id);
    }

    /** Yeni kayıt için görüntülenen sayfadaki en büyük sıranın bir fazlası */
    private nextSortOrder(): number {
        const orders = this.pagedItems.map(item => Number(item.sortOrder ?? 0));
        return orders.length ? Math.max(...orders) + 1 : 1;
    }

    private toPayload(form: ClaimCargoCompanyForm): UpdateClaimCargoCompanyRequest {
        return {
            // Kargo kodu ekrandan alınmıyor; şema alanı zorunlu olduğu için null gönderilir
            deliveryCompanyCode: null,
            cargoExtensionId: form.cargoExtensionId || null,
            customerNo: form.customerNo.trim(),
            accountTitle: form.accountTitle.trim(),
            sortOrder: Number(form.sortOrder),
            isActive: form.isActive,
        };
    }
}

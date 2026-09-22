import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsListPage } from '@/app/views/wms/shared/wms-list-page';
import { WmsCustomersService } from '@/app/core/services/wms/wms-customers.service';
import {
    CustomerResponse,
    UpdateCustomerRequest,
    WmsCustomerListItem,
} from '@/app/core/models/wms/customer-view.models';

/** Üç durumlu filtre: boş değer "tümü" anlamına gelir */
type TriState = '' | 'true' | 'false';

@Component({
    selector: 'app-wms-customers-page',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './customers.html',
    styleUrls: ['./customers.scss'],
})
export class WmsCustomersPage extends WmsListPage<WmsCustomerListItem> {
    private readonly customersService = inject(WmsCustomersService);

    activeFilter: TriState = '';
    individualFilter: TriState = '';

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<WmsCustomerListItem>> {
        return this.customersService.getList({
            ...request,
            isActive: this.toBool(this.activeFilter),
            isIndividualAcc: this.toBool(this.individualFilter),
        });
    }

    get hasActiveFilters(): boolean {
        return !!(this.filterText || this.activeFilter || this.individualFilter);
    }

    clearFilters(): void {
        this.filterText = '';
        this.activeFilter = '';
        this.individualFilter = '';
        this.applyFilters();
    }

    /**
     * Satır içi Aktif/Pasif switch. Güncelleme isteği kartın tüm alanlarını
     * istediği ve liste satırı bunları taşımadığı için önce kayıt okunur,
     * ardından yalnızca `isActive` değiştirilerek geri yazılır.
     */
    async toggleActive(item: WmsCustomerListItem): Promise<void> {
        const nextActive = !item.isActive;
        await this.toggleWith(
            item,
            async () => {
                const response = await this.customersService.getById(item.id);
                if (!response.data) throw new Error('Müşteri kaydı okunamadı.');
                await this.customersService.update(item.id, {
                    ...this.toUpdateRequest(response.data),
                    isActive: nextActive,
                });
            },
            () => (item.isActive = nextActive),
        );
    }

    private toUpdateRequest(customer: CustomerResponse): UpdateCustomerRequest {
        return {
            customerTypeCode: customer.customerTypeCode,
            customerCode: customer.customerCode,
            officeCode: customer.officeCode,
            firstName: customer.firstName,
            lastName: customer.lastName,
            isIndividualAcc: customer.isIndividualAcc,
            taxOfficeCode: customer.taxOfficeCode,
            taxNumber: customer.taxNumber,
            identityNum: customer.identityNum,
            isSubjectToEInvoice: customer.isSubjectToEInvoice,
            dataLanguageCode: customer.dataLanguageCode,
            currencyCode: customer.currencyCode,
            isSendAdvertSMS: customer.isSendAdvertSMS,
            isSendAdvertMail: customer.isSendAdvertMail,
            sourceProvider: customer.sourceProvider,
            externalCustomerId: customer.externalCustomerId,
            isActive: customer.isActive,
        };
    }

    private toBool(value: TriState): boolean | null {
        return value === '' ? null : value === 'true';
    }
}

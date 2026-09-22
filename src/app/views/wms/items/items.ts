import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PagedResult, PaginationRequest } from '@/app/core/models/pagination.model';
import { WmsListPage } from '@/app/views/wms/shared/wms-list-page';
import { WmsItemsService } from '@/app/core/services/wms/wms-items.service';
import { WmsItemTypesService } from '@/app/core/services/wms/wms-item-types.service';
import { ItemTypeResponse } from '@/app/core/models/wms/item-type.models';
import { WmsItemListItem } from '@/app/core/models/wms/item-view.models';

@Component({
    selector: 'app-wms-items-page',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './items.html',
    styleUrls: ['./items.scss'],
})
export class WmsItemsPage extends WmsListPage<WmsItemListItem> {
    private readonly itemsService = inject(WmsItemsService);
    private readonly itemTypesService = inject(WmsItemTypesService);

    itemTypes: ItemTypeResponse[] = [];

    /** Boş değer "tümü" anlamına gelir */
    itemTypeFilter = '';
    activeFilter: '' | 'true' | 'false' = '';

    override ngOnInit(): void {
        super.ngOnInit();
        void this.loadItemTypes();
    }

    protected fetchPage(request: Partial<PaginationRequest>): Promise<PagedResult<WmsItemListItem>> {
        return this.itemsService.getList({
            ...request,
            itemTypeCode: this.itemTypeFilter === '' ? null : Number(this.itemTypeFilter),
            isActive: this.activeFilter === '' ? null : this.activeFilter === 'true',
        });
    }

    get hasActiveFilters(): boolean {
        return !!(this.filterText || this.itemTypeFilter || this.activeFilter);
    }

    clearFilters(): void {
        this.filterText = '';
        this.itemTypeFilter = '';
        this.activeFilter = '';
        this.applyFilters();
    }

    /** Satır içi Aktif/Pasif switch — ürün kartının diğer alanları korunur */
    async toggleActive(item: WmsItemListItem): Promise<void> {
        const nextActive = !item.isActive;
        await this.toggleWith(
            item,
            () =>
                this.itemsService.update(item.id, {
                    itemTypeCode: item.itemTypeCode,
                    itemCode: item.itemCode,
                    isActive: nextActive,
                }),
            () => (item.isActive = nextActive),
        );
    }

    private async loadItemTypes(): Promise<void> {
        try {
            this.itemTypes = await this.itemTypesService.getLookupItems();
        } catch (err) {
            console.error('Ürünler: ürün tipleri yüklenemedi:', err);
        }
    }
}

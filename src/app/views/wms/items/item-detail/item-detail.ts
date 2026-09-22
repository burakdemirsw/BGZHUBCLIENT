import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WmsDetailPage } from '@/app/views/wms/shared/wms-detail-page';
import { WmsOrderSummaryTable } from '@/app/views/wms/shared/order-summary-table/order-summary-table';
import { WmsItemsService } from '@/app/core/services/wms/wms-items.service';
import { WmsItemDetailResponse } from '@/app/core/models/wms/item-view.models';

/**
 * Dokuz alt tablo beş sekmede toplanır: stok sekmesi depo ve raf bakiyesini,
 * özellik sekmesi özellik, çoklu dil açıklama ve notları birlikte gösterir.
 */
type ItemTab = 'variants' | 'prices' | 'stocks' | 'attributes' | 'orders';

@Component({
    selector: 'app-wms-item-detail-page',
    imports: [CommonModule, RouterLink, WmsOrderSummaryTable],
    templateUrl: './item-detail.html',
    styleUrls: ['./item-detail.scss'],
})
export class WmsItemDetailPage extends WmsDetailPage<WmsItemDetailResponse, ItemTab> {
    private readonly itemsService = inject(WmsItemsService);

    activeTab: ItemTab = 'variants';

    protected fetchDetail(id: string): Promise<WmsItemDetailResponse | null> {
        return this.itemsService.getDetails(id);
    }

    /** Renk / beden gibi varyant eksenlerini tek metinde birleştirir */
    variantLabel(colorCode: string | null, itemDim1Code: string | null): string {
        return [colorCode, itemDim1Code].filter(Boolean).join(' / ') || '—';
    }
}

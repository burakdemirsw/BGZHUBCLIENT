import { Route, Routes } from '@angular/router';
import { Type } from '@angular/core';
import { AuthGuard } from '@/app/core/guards/auth.guard';

/**
 * WMS route kaydı üretir.
 *
 * WMS menüsü veritabanında tutulmadığı için `skipMenuAuth` ile menü bazlı
 * yetki kontrolü atlanır; `AuthGuard` yalnızca token geçerliliğine bakar.
 * Sayfa sayısı yüksek olduğundan her kayıt `loadComponent` ile tembel yüklenir.
 */
function wmsRoute(
    path: string,
    title: string,
    loadComponent: () => Promise<Type<unknown>>,
): Route {
    return {
        path: `wms/${path}`,
        loadComponent,
        data: { title, skipMenuAuth: true },
        canActivate: [AuthGuard],
    };
}

/** WMS (Depo Yönetim Sistemi) sayfaları — /api/wms/* uçlarını karşılar */
export const WMS_ROUTES: Routes = [
    // ────── Temel Tanımlar ──────
    wmsRoute('warehouses', 'Depolar', () =>
        import('./warehouses/warehouses').then(m => m.WmsWarehousesPage),
    ),
    wmsRoute('warehouse-types', 'Depo Tipleri', () =>
        import('./warehouse-types/warehouse-types').then(m => m.WmsWarehouseTypesPage),
    ),
    wmsRoute('offices', 'Ofisler', () =>
        import('./offices/offices').then(m => m.WmsOfficesPage),
    ),
    wmsRoute('stores', 'Mağazalar', () =>
        import('./stores/stores').then(m => m.WmsStoresPage),
    ),
    wmsRoute('shelves', 'Raflar', () =>
        import('./shelves/shelves').then(m => m.WmsShelvesPage),
    ),
    wmsRoute('batches', 'Partiler', () =>
        import('./batches/batches').then(m => m.WmsBatchesPage),
    ),
    wmsRoute('colors', 'Renkler', () =>
        import('./colors/colors').then(m => m.WmsColorsPage),
    ),
    wmsRoute('item-types', 'Ürün Tipleri', () =>
        import('./item-types/item-types').then(m => m.WmsItemTypesPage),
    ),
    wmsRoute('item-barcode-types', 'Barkod Tipleri', () =>
        import('./item-barcode-types/item-barcode-types').then(m => m.WmsItemBarcodeTypesPage),
    ),
    wmsRoute('code-sequences', 'Kod Sekansları', () =>
        import('./code-sequences/code-sequences').then(m => m.WmsCodeSequencesPage),
    ),
    wmsRoute('tax-offices', 'Vergi Daireleri', () =>
        import('./tax-offices/tax-offices').then(m => m.WmsTaxOfficesPage),
    ),
    wmsRoute('currencies', 'Para Birimleri', () =>
        import('./currencies/currencies').then(m => m.WmsCurrenciesPage),
    ),

    // ────── Lokasyon ──────
    wmsRoute('countries', 'Ülkeler', () =>
        import('./countries/countries').then(m => m.WmsCountriesPage),
    ),
    wmsRoute('states', 'Bölgeler', () =>
        import('./states/states').then(m => m.WmsStatesPage),
    ),
    wmsRoute('cities', 'İller', () =>
        import('./cities/cities').then(m => m.WmsCitiesPage),
    ),
    wmsRoute('districts', 'İlçeler', () =>
        import('./districts/districts').then(m => m.WmsDistrictsPage),
    ),
];

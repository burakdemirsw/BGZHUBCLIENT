import { MenuItemType } from '@/app/types/layout';

/**
 * WMS yan menüsü — kod tarafında elle tanımlanır.
 *
 * Diğer menüler `MenusService` üzerinden veritabanından gelir; WMS bölümü
 * ise `UserMenuService` tarafından bu listeden eklenir. Böylece sayfalar
 * veritabanına menü kaydı girilmeden görünür olur.
 *
 * Gruplama, kaynağın kapsamını izler: ilk gruplar şirket bazlı kaynakları
 * (`by-company/{companyId}` ucu olanlar) taşır. Şirketten bağımsız, tüm
 * şirketlerde ortak olan tanım tabloları ise "WMS Genel" altında toplanır.
 *
 * Yeni bir WMS sayfası yazıldıkça ilgili grubun `children` dizisine eklenir.
 */
export const WMS_MENU_ITEMS: MenuItemType[] = [
    { label: 'WMS', isTitle: true },
    {
        label: 'Depo Tanımları',
        faIcon: 'fa-solid fa-warehouse',
        isCollapsed: true,
        children: [
            { label: 'Depolar', url: '/wms/warehouses', faIcon: 'fa-solid fa-circle' },
            { label: 'Raflar', url: '/wms/shelves', faIcon: 'fa-solid fa-circle' },
        ],
    },
    {
        label: 'Kuruluş Tanımları',
        faIcon: 'fa-solid fa-building',
        isCollapsed: true,
        children: [
            { label: 'Ofisler', url: '/wms/offices', faIcon: 'fa-solid fa-circle' },
            { label: 'Mağazalar', url: '/wms/stores', faIcon: 'fa-solid fa-circle' },
        ],
    },
    {
        label: 'Ürün Tanımları',
        faIcon: 'fa-solid fa-tags',
        isCollapsed: true,
        children: [
            { label: 'Renkler', url: '/wms/colors', faIcon: 'fa-solid fa-circle' },
            { label: 'Partiler', url: '/wms/batches', faIcon: 'fa-solid fa-circle' },
        ],
    },
    {
        label: 'Sistem Tanımları',
        faIcon: 'fa-solid fa-sliders',
        isCollapsed: true,
        children: [
            { label: 'Kod Sekansları', url: '/wms/code-sequences', faIcon: 'fa-solid fa-circle' },
        ],
    },
    {
        // Şirketten bağımsız (global) tanım tabloları
        label: 'WMS Genel',
        faIcon: 'fa-solid fa-globe',
        isCollapsed: true,
        children: [
            { label: 'Depo Tipleri', url: '/wms/warehouse-types', faIcon: 'fa-solid fa-circle' },
            { label: 'Ürün Tipleri', url: '/wms/item-types', faIcon: 'fa-solid fa-circle' },
            { label: 'Barkod Tipleri', url: '/wms/item-barcode-types', faIcon: 'fa-solid fa-circle' },
            { label: 'Vergi Daireleri', url: '/wms/tax-offices', faIcon: 'fa-solid fa-circle' },
            { label: 'Para Birimleri', url: '/wms/currencies', faIcon: 'fa-solid fa-circle' },
            { label: 'Ülkeler', url: '/wms/countries', faIcon: 'fa-solid fa-circle' },
            { label: 'Bölgeler', url: '/wms/states', faIcon: 'fa-solid fa-circle' },
            { label: 'İller', url: '/wms/cities', faIcon: 'fa-solid fa-circle' },
            { label: 'İlçeler', url: '/wms/districts', faIcon: 'fa-solid fa-circle' },
        ],
    },
];

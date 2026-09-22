import { MenuItemType } from '@/app/types/layout';

/**
 * Sistem menüsü — kod tarafında elle tanımlanır (WMS menüsüyle aynı yöntem).
 *
 * Menü kaydı veritabanında olmadığı için `UserMenuService` bu listeyi
 * diğer statik menülerle birlikte veritabanı menülerinin sonuna ekler.
 * Yeni sistem sayfaları yazıldıkça "Sistem" grubunun `children` dizisine eklenir.
 */
export const SYSTEM_MENU_ITEMS: MenuItemType[] = [
    { label: 'Yönetim', isTitle: true },
    { label: 'Uygulamalar', url: '/system/apps', faIcon: 'fa-solid fa-cubes' },
    {
        label: 'Sistem',
        faIcon: 'fa-solid fa-gears',
        isCollapsed: true,
        children: [
            { label: 'Arka Plan Servisleri', url: '/background-jobs', faIcon: 'fa-solid fa-circle' },
            { label: 'Arka Plan Ayar Tanımları', url: '/background-jobs/setting-definitions', faIcon: 'fa-solid fa-circle' },
            { label: 'Arka Plan Extension Ayarları', url: '/background-jobs/extension-settings', faIcon: 'fa-solid fa-circle' },
        ],
    },
];

import { MenuItemType } from '@/app/types/layout';

/**
 * Soru & Cevap Merkezi menüsü — kod tarafında elle tanımlanır.
 *
 * Menü kaydı veritabanında olmadığı için `UserMenuService` bu listeyi
 * WMS menüsüyle birlikte veritabanı menülerinin sonuna ekler.
 */
export const MARKETPLACE_QUESTIONS_MENU_ITEMS: MenuItemType[] = [
    { label: 'Soru & Cevap', isTitle: true },
    {
        label: 'Soru & Cevap Merkezi',
        url: '/marketplace-questions',
        faIcon: 'fa-regular fa-comments',
    },
];

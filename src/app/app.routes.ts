import {Routes, UrlMatchResult, UrlSegment} from '@angular/router';
import {MainLayout} from '@layouts/main-layout/main-layout';
import {Landing} from './views/landing/landing';

/**
 * '/nebim-ai-chat' ve '/c/:conversationId' tek route kaydina eslenir; ayri kayitlar olsaydi
 * aralarindaki her geciste sohbet sayfasi yok edilip yeniden olusturulurdu.
 */
export function nebimAiChatMatcher(segments: UrlSegment[]): UrlMatchResult | null {
    if (segments.length === 1 && segments[0].path === 'nebim-ai-chat') {
        return {consumed: segments};
    }
    if (segments.length === 2 && segments[0].path === 'c') {
        return {consumed: segments, posParams: {conversationId: segments[1]}};
    }
    return null;
}

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
    },
    {
        path: 'home',
        component: Landing,
        data: {title: 'BGZHUB — E-ticaret, Pazaryeri ve WMS Yönetim Platformu'}
    },
    {
        matcher: nebimAiChatMatcher,
        loadComponent: () =>
            import('./views/admin/nebim-ai-chat/nebim-ai-chat/nebim-ai-chat').then(m => m.NebimAiChatPage),
        data: {title: 'BGZHUB AI Chat'}
    },
    /**
     * Sipariş Detay & İade İşlemleri paneli — public, guard ve layout yok.
     * Parametreler verilmezse sayfa test verileriyle çalışır.
     */
    {
        path: 'order-tracking/:companyId/:extensionId',
        loadComponent: () => import('./views/order-tracking/order-tracking').then(m => m.OrderTrackingPage),
        data: {title: 'Sipariş Detayı'}
    },
    {
        path: 'order-tracking',
        loadComponent: () => import('./views/order-tracking/order-tracking').then(m => m.OrderTrackingPage),
        data: {title: 'Sipariş Detayı'}
    },
    {
        path: '',
        component: MainLayout,
        loadChildren: () => import('./views/views.route').then((mod) => mod.VIEWS_ROUTES)
    },
    {
        path: '',
        loadChildren: () => import('./views/auth/auth.route').then((mod) => mod.AUTH_ROUTES)
    },
    {
        path: '',
        loadChildren: () => import('./views/error/error.route').then((mod) => mod.ERROR_PAGES_ROUTES)
    },
    {
        path: '',
        loadChildren: () => import('./views/other-pages/other-pages.route').then((mod) => mod.OTHER_PAGES_ROUTES)
    },
    {
        path: 'landing',
        redirectTo: 'home',
        pathMatch: 'full'
    },
];

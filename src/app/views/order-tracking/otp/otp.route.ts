import { Route, Routes } from '@angular/router';
import { Type } from '@angular/core';
import { AuthGuard } from '@/app/core/guards/auth.guard';

/**
 * OTP (sipariş takip paneli) yönetim route'ları.
 *
 * WMS menüsü gibi bu sayfalar da menü tablosunda tutulmadığı için `skipMenuAuth`
 * ile menü bazlı yetki kontrolü atlanır; `AuthGuard` yalnızca token'a bakar.
 */
function otpRoute(
    path: string,
    title: string,
    loadComponent: () => Promise<Type<unknown>>,
): Route {
    return {
        path: `otp/${path}`,
        loadComponent,
        data: { title, skipMenuAuth: true },
        canActivate: [AuthGuard],
    };
}

/** /api/wms/order-tracking-* uçlarını yöneten sayfalar */
export const OTP_ROUTES: Routes = [
    otpRoute('settings', 'Sipariş Takip Ayarları', () =>
        import('./settings/settings').then(m => m.OtpSettingsPage),
    ),
    otpRoute('setting-definitions', 'Sipariş Takip Ayar Tanımları', () =>
        import('./setting-definitions/setting-definitions').then(m => m.OtpSettingDefinitionsPage),
    ),
    otpRoute('return-reasons', 'İade Nedenleri', () =>
        import('./return-reasons/return-reasons').then(m => m.OtpReturnReasonsPage),
    ),
    otpRoute('return-instructions', 'İade Bilgilendirme Maddeleri', () =>
        import('./return-instructions/return-instructions').then(m => m.OtpReturnInstructionsPage),
    ),
    otpRoute('after-return-actions', 'İade Sonrası İşlem Tipleri', () =>
        import('./after-return-actions/after-return-actions').then(m => m.OtpAfterReturnActionsPage),
    ),
    otpRoute('claim-cargo-companies', 'İade Kargo Şirketleri', () =>
        import('./claim-cargo-companies/claim-cargo-companies').then(m => m.OtpClaimCargoCompaniesPage),
    ),
    otpRoute('claims', 'İade Talepleri', () =>
        import('./claims/claims').then(m => m.OtpClaimsPage),
    ),
    otpRoute('claims/:id', 'İade Talebi Detayı', () =>
        import('./claims/claim-detail/claim-detail').then(m => m.OtpClaimDetailPage),
    ),
    otpRoute('claim-status', 'İade Talebi Durumları', () =>
        import('./claim-status/claim-status').then(m => m.OtpClaimStatusPage),
    ),
    otpRoute('order-links', 'Sipariş Bağlantıları', () =>
        import('./order-links/order-links').then(m => m.OtpOrderLinksPage),
    ),
];

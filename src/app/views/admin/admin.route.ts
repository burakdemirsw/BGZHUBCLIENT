import { Routes } from '@angular/router';
import { UsersPage } from './users/users';
import { RolesPage } from './roles/roles';
import { MenusPage } from './menus/menus';
import { MailSettingsPage } from './mail-settings/mail-settings';
import { NetGsmSettingsPage } from './netgsm-settings/netgsm-settings';
import { CountriesPage } from './countries/countries';
import { CitiesPage } from './cities/cities';
import { DistrictsPage } from './districts/districts';
import { IntegrationsPage } from './integrations/integrations';
import { RoleAssignmentsPage } from './role-assignments/role-assignments';
import { RoleMenusPage } from './role-menus/role-menus';
import { SocialMediaAccountsPage } from './social-media/accounts/accounts';
import { SocialMediaDescriptionsPage } from './social-media/descriptions/descriptions';
import { SocialMediaPropertiesPage } from './social-media/properties/properties';
import { UserIntegrationsPage } from './user-integrations/user-integrations';
import { IntegrationPropertiesPage } from './integration-properties/integration-properties';
import { AuthGuard } from '@/app/core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
    {
        path: 'admin/users',
        component: UsersPage,
        data: { title: 'Kullanıcılar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/roles',
        component: RolesPage,
        data: { title: 'Roller' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/menus',
        component: MenusPage,
        data: { title: 'Menüler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/mail-settings',
        component: MailSettingsPage,
        data: { title: 'Mail Ayarları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/netgsm-settings',
        component: NetGsmSettingsPage,
        data: { title: 'NetGsm Ayarları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/countries',
        component: CountriesPage,
        data: { title: 'Ülkeler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/cities',
        component: CitiesPage,
        data: { title: 'İller' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/districts',
        component: DistrictsPage,
        data: { title: 'İlçeler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/integrations',
        component: IntegrationsPage,
        data: { title: 'Entegrasyonlar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/user-integrations',
        component: UserIntegrationsPage,
        data: { title: 'Kullanıcı Entegrasyonları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/integration-properties',
        component: IntegrationPropertiesPage,
        data: { title: 'Entegrasyon Özellikleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/role-assignments',
        component: RoleAssignmentsPage,
        data: { title: 'Rol Atamaları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/role-menus',
        component: RoleMenusPage,
        data: { title: 'Menü Atamaları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/social-media/accounts',
        component: SocialMediaAccountsPage,
        data: { title: 'Sosyal Medya Hesapları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/social-media/descriptions',
        component: SocialMediaDescriptionsPage,
        data: { title: 'Hesap Açıklamaları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/social-media/properties',
        component: SocialMediaPropertiesPage,
        data: { title: 'Hesap Özellikleri' },
        canActivate: [AuthGuard],
    },
];

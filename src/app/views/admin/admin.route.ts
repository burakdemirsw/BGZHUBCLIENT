import { Routes } from '@angular/router';
import { UsersPage } from './users/users';
import { RolesPage } from './roles/roles';
import { MenusPage } from './menus/menus';
import { MailSettingsPage } from './mail-settings/mail-settings';
import { NetGsmSettingsPage } from './netgsm-settings/netgsm-settings';
import { CountriesPage } from './countries/countries';
import { CitiesPage } from './cities/cities';
import { DistrictsPage } from './districts/districts';
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
];

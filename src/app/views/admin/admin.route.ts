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
import { SocialMediaPropertiesPage } from './social-media/properties/properties';
import { UserSocialMediaAccountsPage } from './social-media/user-accounts/user-accounts';
import { CustomersPage } from './customers/customers';
import { UserIntegrationsPage } from './user-integrations/user-integrations';
import { IntegrationPropertiesPage } from './integration-properties/integration-properties';
import { AiProvidersPage } from './ai-assistants/ai-providers/ai-providers';
import { AiSettingsPage } from './ai-assistants/ai-settings/ai-settings';
import { AiModelsPage } from './ai-assistants/ai-models/ai-models';
import { AiProviderSettingsPage } from './ai-assistants/ai-provider-settings/ai-provider-settings';
import { AiAssistantsPage } from './ai-assistants/ai-assistants-list/ai-assistants';
import { RequestCategoriesPage } from './request-categories/request-categories';
import { RequestPrioritiesPage } from './request-priorities/request-priorities';
import { RequestStatusesPage } from './request-statuses/request-statuses';
import { UserRequestsPage } from './user-requests/user-requests';
import { UserRequestDetailPage } from './user-requests/user-request-detail';
import { TeamsPage } from './teams/teams';
import { TeamInvitationsPage } from './teams/team-invitations/team-invitations';
import { TeamSettingsPage } from './teams/team-settings/team-settings';
import { ImageSearchPage } from './image-search/image-search';
import { IntegrationTypesPage } from './integration-types/integration-types';
import { PromptsPage } from './prompts/prompts';
import { PromptAiAssistantsPage } from './prompt-ai-assistants/prompt-ai-assistants';
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
        path: 'admin/customers',
        component: CustomersPage,
        data: { title: 'Musteriler' },
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
        path: 'admin/social-media/properties',
        component: SocialMediaPropertiesPage,
        data: { title: 'Hesap Özellikleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/social-media/user-accounts',
        component: UserSocialMediaAccountsPage,
        data: { title: 'Kullanıcı Sosyal Medya Hesapları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-provider-settings',
        component: AiProviderSettingsPage,
        data: { title: 'AI Sağlayıcı Ayarları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-models',
        component: AiModelsPage,
        data: { title: 'AI Modelleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-providers',
        component: AiProvidersPage,
        data: { title: 'AI Sağlayıcılar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-settings',
        component: AiSettingsPage,
        data: { title: 'AI Ayarlar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-assistants',
        component: AiAssistantsPage,
        data: { title: 'AI Asistanlar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/request-categories',
        component: RequestCategoriesPage,
        data: { title: 'Talep Kategorileri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/request-priorities',
        component: RequestPrioritiesPage,
        data: { title: 'Talep Öncelikleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/request-statuses',
        component: RequestStatusesPage,
        data: { title: 'Talep Durumları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/user-requests',
        component: UserRequestsPage,
        data: { title: 'Kullanıcı Talepleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/user-requests/:id',
        component: UserRequestDetailPage,
        data: { title: 'Talep Detayı' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/teams',
        component: TeamsPage,
        data: { title: 'Takımlar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/team-invitations',
        component: TeamInvitationsPage,
        data: { title: 'Takım Davetleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/team-settings',
        component: TeamSettingsPage,
        data: { title: 'Takım Ayarları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/image-search',
        component: ImageSearchPage,
        data: { title: 'Görsel Arama' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/integration-types',
        component: IntegrationTypesPage,
        data: { title: 'Entegrasyon Tipleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/prompts',
        component: PromptsPage,
        data: { title: 'Promptlar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/prompt-ai-assistants',
        component: PromptAiAssistantsPage,
        data: { title: 'Prompt Asistan Atamaları' },
        canActivate: [AuthGuard],
    },
];

import { Routes } from '@angular/router';
import { AuthGuard } from '@/app/core/guards/auth.guard';
import { Profile } from '@/app/views/apps/users/profile/profile';
import { AiAssistantsPage } from './ai-assistants/ai-assistants-list/ai-assistants';
import { AiModelsPage } from './ai-assistants/ai-models/ai-models';
import { AiProviderSettingsPage } from './ai-assistants/ai-provider-settings/ai-provider-settings';
import { AiProvidersPage } from './ai-assistants/ai-providers/ai-providers';
import { AiSettingsPage } from './ai-assistants/ai-settings/ai-settings';
import { AiKnowledgePage } from './ai-knowledge/ai-knowledge';
import { AiKnowledgeTypesPage } from './ai-knowledge-types/ai-knowledge-types';
import { AiRequestLogsPage } from './ai-request-logs/ai-request-logs';
import { AwsS3SettingsPage } from './aws-s3-settings/aws-s3-settings';
import { CloudinarySettingsPage } from './cloudinary-settings/cloudinary-settings';
import { CompaniesPage } from './companies/companies';
import { CompanyDetailPage } from './companies/company-detail';
import { ConversationListDescriptionsPage } from './conversation-list-descriptions/conversation-list-descriptions';
import { ConversationListsPage } from './conversation-lists/conversation-lists';
import { ConversationNotesPage } from './conversation-notes/conversation-notes';
import { ConversationSegmentsPage } from './conversation-segments/conversation-segments';
import { ConversationTagsPage } from './conversation-tags/conversation-tags';
import { ConversationTypesPage } from './conversation-types/conversation-types';
import { MailSettingsPage } from './mail-settings/mail-settings';
import { MenusPage } from './menus/menus';
import { NetGsmSettingsPage } from './netgsm-settings/netgsm-settings';
import { NebimQueriesPage } from '@/app/views/admin/nebim-queries/nebim-queries';
import { NebimSchemaPage } from './nebim-schema/nebim-schema';
import { PlansPage } from './plans/plans';
import { PromptAiAssistantsPage } from './prompt-ai-assistants/prompt-ai-assistants';
import { PromptsPage } from './prompts/prompts';
import { PromptTypesPage } from './prompt-types/prompt-types';
import { RoleAssignmentsPage } from './role-assignments/role-assignments';
import { RoleMenusPage } from './role-menus/role-menus';
import { RolesPage } from './roles/roles';
import { SegmentsPage } from './segments/segments';
import { ShortcutsPage } from './shortcuts/shortcuts';
import { ShortcutTypesPage } from './shortcut-types/shortcut-types';
import { SubscriptionPaymentsPage } from './subscription-payments/subscription-payments';
import { SubscriptionsPage } from './subscriptions/subscriptions';
import { SubscriptionUsagesPage } from './subscription-usages/subscription-usages';
import { TagsPage } from './tags/tags';
import { TeamUsersPage } from './team-users/team-users';
import { TeamInvitationsPage } from './teams/team-invitations/team-invitations';
import { TeamSettingsPage } from './teams/team-settings/team-settings';
import { TeamsPage } from './teams/teams';
import { UserTypesPage } from './user-types/user-types';

export const ADMIN_ROUTES: Routes = [
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
        path: 'admin/nebim-queries',
        component: NebimQueriesPage,
        data: { title: 'Nebim Sorguları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/nebim-schema',
        component: NebimSchemaPage,
        data: { title: 'Nebim Schema' },
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
        path: 'admin/team-users',
        component: TeamUsersPage,
        data: { title: 'Takım Kullanıcıları' },
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
    {
        path: 'admin/prompt-types',
        component: PromptTypesPage,
        data: { title: 'Prompt Tipleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/tags',
        component: TagsPage,
        data: { title: 'Etiketler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/conversation-tags',
        component: ConversationTagsPage,
        data: { title: 'Konuşma Etiketleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/conversation-notes',
        component: ConversationNotesPage,
        data: { title: 'Konuşma Notları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/companies',
        component: CompaniesPage,
        data: { title: 'Şirketler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/company-detail',
        component: CompanyDetailPage,
        data: { title: 'Şirket Detayı' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/segments',
        component: SegmentsPage,
        data: { title: 'Segmentler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/conversation-segments',
        component: ConversationSegmentsPage,
        data: { title: 'Konuşma Segmentleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/conversation-list-descriptions',
        component: ConversationListDescriptionsPage,
        data: { title: 'Konuşma Listeleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/conversation-lists',
        component: ConversationListsPage,
        data: { title: 'Konuşma Liste İçerikleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/shortcut-types',
        component: ShortcutTypesPage,
        data: { title: 'Kısayol Tipleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/shortcuts',
        component: ShortcutsPage,
        data: { title: 'Kısayollar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/user-types',
        component: UserTypesPage,
        data: { title: 'Kullanıcı Türleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-request-logs',
        component: AiRequestLogsPage,
        data: { title: 'AI İstek Logları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-knowledge',
        component: AiKnowledgePage,
        data: { title: 'AI Bilgi Bankası' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/ai-knowledge-types',
        component: AiKnowledgeTypesPage,
        data: { title: 'AI Bilgi Tipleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/plans',
        component: PlansPage,
        data: { title: 'Planlar' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/subscriptions',
        component: SubscriptionsPage,
        data: { title: 'Abonelikler' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/subscription-payments',
        component: SubscriptionPaymentsPage,
        data: { title: 'Abonelik Ödemeleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/subscription-usages',
        component: SubscriptionUsagesPage,
        data: { title: 'Abonelik Kullanımları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/conversation-types',
        component: ConversationTypesPage,
        data: { title: 'Konuşma Türleri' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/cloudinary-settings',
        component: CloudinarySettingsPage,
        data: { title: 'Cloudinary Ayarları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'admin/aws-s3-settings',
        component: AwsS3SettingsPage,
        data: { title: 'AWS S3 Ayarları' },
        canActivate: [AuthGuard],
    },
    {
        path: 'users/profile',
        component: Profile,
        data: { title: 'Profil' },
        canActivate: [AuthGuard],
    },
];

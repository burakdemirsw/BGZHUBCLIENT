import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserIntegrationUserSocialMediaAccountsService } from '@/app/core/services/user-integration-user-social-media-accounts.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    UserIntegrationUserSocialMediaAccount,
    CreateUserIntegrationUserSocialMediaAccountRequest,
    UpdateUserIntegrationUserSocialMediaAccountRequest,
} from '@/app/core/models/integration/user-integration-user-social-media-account.models';

@Component({
    selector: 'app-user-integration-user-social-media-accounts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-integration-user-social-media-accounts.html',
})
export class UserIntegrationUserSocialMediaAccountsPage implements OnInit {
    items: UserIntegrationUserSocialMediaAccount[] = [];
    integrationUsers: any[] = [];
    socialMediaAccounts: any[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: UserIntegrationUserSocialMediaAccount | null = null;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];

    companyId = '';
    userId = '';

    form: any = {
        integrationUserId: '',
        socialMediaAccountId: '',
    };

    constructor(
        private service: UserIntegrationUserSocialMediaAccountsService,
        private integrationsService: IntegrationsService,
        private socialMediaService: SocialMediaService,
        private authStateService: AuthStateService
    ) {}

    ngOnInit(): void {
        this.companyId = this.authStateService.profile?.companyId || '';
        this.userId = this.authStateService.profile?.userId || '';
        this.loadLookups();
        this.loadItems();
    }

    onSearchChange(): void {
        this.currentPage = 1;
        this.loadItems();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadItems();
    }

    async loadLookups(): Promise<void> {
        try {
            const [intUsersRes, smRes] = await Promise.all([
                this.integrationsService.getIntegrationUsersPaged({ pageNumber: 1, pageSize: 1000 }),
                this.socialMediaService.getUserAccounts({ pageNumber: 1, pageSize: 1000 }),
            ]);
            //console.log('intUsersRes:', intUsersRes);
            //console.log('smRes:', smRes);
            const intUsersPaged = intUsersRes?.data;
            const smData = smRes?.data;
            this.integrationUsers = intUsersPaged?.items ?? [];
            this.socialMediaAccounts = this.extractArray(smData);
            //console.log('integrationUsers:', this.integrationUsers);
            //console.log('socialMediaAccounts:', this.socialMediaAccounts);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = this.companyId
                ? await this.service.getByCompany(this.companyId, { pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm })
                : await this.service.getAll({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            //console.log('UserIntegrationUserSocialMediaAccounts response:', response);

            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('UserIntegrationUserSocialMediaAccounts error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    getIntegrationUserName(id: string): string {
        const item = this.integrationUsers.find(i => i.id === id);
        return item?.integrationDescription || item?.userName || item?.name || id || '-';
    }

    getSocialMediaAccountName(id: string): string {
        const item = this.socialMediaAccounts.find(i => i.id === id);
        return item?.accountName || item?.name || id || '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            integrationUserId: '',
            socialMediaAccountId: '',
        };
        this.showModal = true;
    }

    openEdit(item: UserIntegrationUserSocialMediaAccount): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            integrationUserId: item.integrationUserId,
            socialMediaAccountId: item.socialMediaAccountId,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateUserIntegrationUserSocialMediaAccountRequest = {
                    companyId: this.companyId,
                    integrationUserId: this.form.integrationUserId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    userId: this.userId,
                };
                //console.log('Update request:', req);
                const res = await this.service.update(this.selectedItem.id, req);
                //console.log('Update response:', res);
            } else {
                const req: CreateUserIntegrationUserSocialMediaAccountRequest = {
                    companyId: this.companyId,
                    integrationUserId: this.form.integrationUserId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    userId: this.userId,
                };
                //console.log('Create request:', req);
                const res = await this.service.create(req);
                //console.log('Create response:', res);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı (CORS veya ağ hatası).\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: UserIntegrationUserSocialMediaAccount): Promise<void> {
        const name = this.getIntegrationUserName(item.integrationUserId) + ' - ' + this.getSocialMediaAccountName(item.socialMediaAccountId);
        if (confirm(`"${name}" kaydını silmek istediğinize emin misiniz?`)) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

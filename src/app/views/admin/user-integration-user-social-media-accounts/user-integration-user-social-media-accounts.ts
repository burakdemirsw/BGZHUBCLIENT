import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserIntegrationUserSocialMediaAccountsService } from '@/app/core/services/user-integration-user-social-media-accounts.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import {
    UserIntegrationUserSocialMediaAccountResponse,
    CreateUserIntegrationUserSocialMediaAccountRequest,
    UpdateUserIntegrationUserSocialMediaAccountRequest,
} from '@/app/core/models/integration/user-integration-user-social-media-account.models';
import { PagedResult } from '@/app/core/models/pagination.model';

@Component({
    selector: 'app-user-integration-user-social-media-accounts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-integration-user-social-media-accounts.html',
})
export class UserIntegrationUserSocialMediaAccountsPage implements OnInit {
    items: UserIntegrationUserSocialMediaAccountResponse[] = [];
    filteredItems: UserIntegrationUserSocialMediaAccountResponse[] = [];
    pagedItems: UserIntegrationUserSocialMediaAccountResponse[] = [];
    integrationUsers: any[] = [];
    socialMediaAccounts: any[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: UserIntegrationUserSocialMediaAccountResponse | null = null;

    filterText = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    companyId = '';
    userId = '';

    form: any = {
        integrationUserId: '',
        userSocialMediaAccountId: '',
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

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const term = this.filterText.toLowerCase().trim();
        this.filteredItems = term
            ? this.items.filter(item =>
                  (item.socialMediaAccountName ?? '').toLowerCase().includes(term)
              )
            : [...this.items];

        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);

        if (this.currentPage > this.totalPages) {
            this.currentPage = this.totalPages;
        }

        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadLookups(): Promise<void> {
        try {
            const [intUsersRes, smRes] = await Promise.all([
                this.integrationsService.getIntegrationUsersPaged({ companyId: this.companyId, pageNumber: 1, pageSize: 1000 }),
                this.socialMediaService.getUserAccounts({ companyId: this.companyId, pageNumber: 1, pageSize: 1000 }),
            ]);
            //console.log('intUsersRes:', intUsersRes);
            //console.log('smRes:', smRes);
            const intUsersPaged = intUsersRes?.data;
            const smPaged = smRes?.data;
            this.integrationUsers = intUsersPaged?.items ?? [];
            this.socialMediaAccounts = smPaged?.items ?? this.extractArray(smPaged);
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
                ? await this.service.getByCompany(this.companyId, { companyId: this.companyId, pageNumber: 1, pageSize: 1000 })
                : await this.service.getAll({ companyId: this.companyId, pageNumber: 1, pageSize: 1000 });

            const paged = PagedResult.from<UserIntegrationUserSocialMediaAccountResponse>(response);
            this.items = paged.items;
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('UserIntegrationUserSocialMediaAccounts error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray(response: any): UserIntegrationUserSocialMediaAccountResponse[] {
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
        return item?.socialMediaAccountName || item?.accountName || item?.name || id || '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            integrationUserId: '',
            userSocialMediaAccountId: '',
        };
        this.showModal = true;
    }

    openEdit(item: UserIntegrationUserSocialMediaAccountResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            integrationUserId: item.integrationUserId ?? '',
            userSocialMediaAccountId: item.userSocialMediaAccountId ?? '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateUserIntegrationUserSocialMediaAccountRequest = {
                    companyId: this.companyId,
                    integrationUserId: this.form.integrationUserId,
                    userSocialMediaAccountId: this.form.userSocialMediaAccountId,
                    userId: this.userId,
                };
                //console.log('Update request:', req);
                const res = await this.service.update(this.selectedItem.id, req);
                //console.log('Update response:', res);
            } else {
                const req: CreateUserIntegrationUserSocialMediaAccountRequest = {
                    companyId: this.companyId,
                    integrationUserId: this.form.integrationUserId,
                    userSocialMediaAccountId: this.form.userSocialMediaAccountId,
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

    async deleteItem(item: UserIntegrationUserSocialMediaAccountResponse): Promise<void> {
        const name = item.socialMediaAccountName || this.getSocialMediaAccountName(item.userSocialMediaAccountId);
        const userName = item.userName ? `${item.userName} ${item.userLastName || ''}`.trim() : '-';
        if (confirm(`"${userName}" kullanıcısının "${name}" hesap atamasını silmek istediğinize emin misiniz?`)) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err: any) {
                console.error('Delete error:', err);
                const msg =
                    err.status === 0
                        ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                        : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
                alert('Silme işlemi başarısız:\n' + msg);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

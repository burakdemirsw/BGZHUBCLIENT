import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationSocialMediaAccountsService } from '@/app/core/services/integration-social-media-accounts.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { UsersService } from '@/app/core/services/users.service';
import {
    IntegrationSocialMediaAccount,
    CreateIntegrationSocialMediaAccountRequest,
    UpdateIntegrationSocialMediaAccountRequest,
} from '@/app/core/models/integration/integration-social-media-account.models';

@Component({
    selector: 'app-integration-social-media-accounts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integration-social-media-accounts.html',
})
export class IntegrationSocialMediaAccountsPage implements OnInit {
    items: IntegrationSocialMediaAccount[] = [];
    integrations: any[] = [];
    socialMediaAccounts: any[] = [];
    users: any[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: IntegrationSocialMediaAccount | null = null;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];

    form: any = {
        integrationId: '',
        socialMediaAccountId: '',
        userId: '',
    };

    constructor(
        private service: IntegrationSocialMediaAccountsService,
        private integrationsService: IntegrationsService,
        private socialMediaService: SocialMediaService,
        private usersService: UsersService
    ) {}

    ngOnInit(): void {
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
            const [intRes, smRes, usrRes] = await Promise.all([
                this.integrationsService.getAll(),
                this.socialMediaService.getAccountsPaged(1, 1000, ''),
                this.usersService.getAll(1, 1000),
            ]);
            this.integrations = this.extractArray(intRes?.items || intRes);
            this.socialMediaAccounts = this.extractArray(smRes?.items || smRes);
            this.users = this.extractArray(usrRes?.items || usrRes);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    } 

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll(this.currentPage, this.pageSize, this.searchTerm);
            console.log('IntegrationSocialMediaAccounts response:', response);
            
            const data = response?.data || response;
            this.items = this.extractArray(data?.items || data);
            this.totalCount = data?.totalCount || data?.total || this.items.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        } catch (err) {
            console.error('IntegrationSocialMediaAccounts error:', err);
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

    getIntegrationName(id: string): string {
        const item = this.integrations.find(i => i.id === id);
        return item?.integrationDescription || id || '-';
    }

    getSocialMediaAccountName(id: string): string {
        const item = this.socialMediaAccounts.find(i => i.id === id);
        return item?.accountName || item?.name || id || '-';
    }

    getUserName(id: string): string {
        const item = this.users.find(i => i.id === id);
        return item?.fullName || item?.userName || id || '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            integrationId: '',
            socialMediaAccountId: '',
            userId: '',
        };
        this.showModal = true;
    }

    openEdit(item: IntegrationSocialMediaAccount): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            integrationId: item.integrationId,
            socialMediaAccountId: item.socialMediaAccountId,
            userId: item.userId,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateIntegrationSocialMediaAccountRequest = {
                    integrationId: this.form.integrationId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    userId: this.form.userId,
                };
                console.log('Update request:', req);
                const res = await this.service.update(this.selectedItem.id, req);
                console.log('Update response:', res);
            } else {
                const req: CreateIntegrationSocialMediaAccountRequest = {
                    integrationId: this.form.integrationId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    userId: this.form.userId,
                };
                console.log('Create request:', req);
                const res = await this.service.create(req);
                console.log('Create response:', res);
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

    async deleteItem(item: IntegrationSocialMediaAccount): Promise<void> {
        const name = this.getIntegrationName(item.integrationId) + ' - ' + this.getSocialMediaAccountName(item.socialMediaAccountId);
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

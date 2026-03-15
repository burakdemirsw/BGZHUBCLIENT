import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { FacebookLoginService, FacebookConfig } from '@/app/core/services/facebook-login.service';
import {
    SocialMediaAccount,
    CreateSocialMediaAccountRequest,
    UpdateSocialMediaAccountRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-social-media-accounts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './accounts.html',
})
export class SocialMediaAccountsPage implements OnInit {
    accounts: SocialMediaAccount[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedAccount: SocialMediaAccount | null = null;

    // Datatable
    filterText = '';
    filteredItems: SocialMediaAccount[] = [];
    pagedItems: SocialMediaAccount[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        name: '',
        photoUrl: '',
        isBlocked: false,
    };

    // Facebook Graph API config — kendi değerlerinizi girin
    fbConfig: FacebookConfig = {
        appId: 'YOUR_APP_ID',
        configId: 'YOUR_CONFIG_ID',
        version: 'v21.0',
    };

    constructor(
        private socialMediaService: SocialMediaService,
        private facebookLoginService: FacebookLoginService,
    ) {}

    ngOnInit(): void {
        this.facebookLoginService.initFacebookSdk(this.fbConfig);
        this.loadAccounts();
    }

    async connectFacebook(): Promise<void> {
        try {
            const result = await this.facebookLoginService.fbLogin(this.fbConfig.configId);
            console.log('Facebook connect response:', result);
            await this.loadAccounts();
        } catch (err) {
            console.error('Facebook connect error:', err);
        }
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
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.accounts.filter(a =>
            a.name.toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadAccounts(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.socialMediaService.getAccounts();
            console.log('SocialMedia Accounts response:', response);
            this.accounts = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('SocialMedia Accounts error:', err);
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

    openCreate(): void {
        this.editMode = false;
        this.selectedAccount = null;
        this.form = { name: '', photoUrl: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(account: SocialMediaAccount): void {
        this.editMode = true;
        this.selectedAccount = account;
        this.form = {
            name: account.name,
            photoUrl: account.photoUrl || '',
            isBlocked: account.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedAccount) {
                const req: UpdateSocialMediaAccountRequest = {
                    name: this.form.name,
                    photoUrl: this.form.photoUrl,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.socialMediaService.updateAccount(this.selectedAccount.id, req);
            } else {
                const req: CreateSocialMediaAccountRequest = {
                    name: this.form.name,
                    photoUrl: this.form.photoUrl,
                };
                await this.socialMediaService.createAccount(req);
            }
            this.showModal = false;
            await this.loadAccounts();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteAccount(account: SocialMediaAccount): Promise<void> {
        if (confirm(`"${account.name}" hesabını silmek istediğinize emin misiniz?`)) {
            try {
                await this.socialMediaService.deleteAccount(account.id);
                await this.loadAccounts();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

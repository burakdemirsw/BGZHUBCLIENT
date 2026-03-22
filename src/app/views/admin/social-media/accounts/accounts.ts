import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class SocialMediaAccountsPage implements OnInit, OnDestroy {
    items: SocialMediaAccount[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedAccount: SocialMediaAccount | null = null;

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];

    form: any = {
        name: '',
        photoUrl: '',
        isBlocked: false,
    };

    // Facebook Graph API config
    fbConfig: FacebookConfig = {
        appId: '2082246998779710',
        configId: '500411992500266',
        version: 'v25.0',
    };

    // WhatsApp Embedded Signup config (aynı Meta App, farklı config_id)
    waConfigId = '1639903583536990';

    private messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'facebook-callback' && event.data?.success) {
            //console.log('Facebook callback data received via postMessage:', event.data.data);
            this.loadItems();
        }
    };

    constructor(
        private socialMediaService: SocialMediaService,
        private facebookLoginService: FacebookLoginService,
    ) {}

    async ngOnInit(): Promise<void> {
        window.addEventListener('message', this.messageListener);
        await this.facebookLoginService.initFacebookSdk(this.fbConfig);
        this.loadItems();
    }

    ngOnDestroy(): void {
        window.removeEventListener('message', this.messageListener);
    }

    async connectFacebook(): Promise<void> {
        try {
            const code = await this.facebookLoginService.fbLogin(this.fbConfig.configId);
            //console.log('Facebook code:', code);
            const result = await this.facebookLoginService.sendFacebookCode(code);
            //console.log('Facebook backend response:', result);
            await this.loadItems();
        } catch (err) {
            console.error('Facebook connect error:', err);
        }
    }

    async connectWhatsapp(): Promise<void> {
        try {
            const code = await this.facebookLoginService.fbLogin(this.waConfigId);
            //console.log('WhatsApp code:', code);
            const result = await this.facebookLoginService.sendWhatsappCode(code);
            //console.log('WhatsApp backend response:', result);
            await this.loadItems();
        } catch (err) {
            console.error('WhatsApp connect error:', err);
        }
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

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.socialMediaService.getAccountsPaged({ pageNumber: this.currentPage, pageSize: this.pageSize, searchTerm: this.searchTerm });
            //console.log('SocialMedia Accounts response:', response);
            
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.totalCount = paged?.totalCount ?? this.items.length;
            this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
            this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
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
            await this.loadItems();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteAccount(account: SocialMediaAccount): Promise<void> {
        if (confirm(`"${account.name}" hesabını silmek istediğinize emin misiniz?`)) {
            try {
                await this.socialMediaService.deleteAccount(account.id);
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

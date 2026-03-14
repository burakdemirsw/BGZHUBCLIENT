import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialMediaService } from '@/app/core/services/social-media.service';
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

    form: any = {
        name: '',
        isBlocked: false,
    };

    constructor(
        private socialMediaService: SocialMediaService,
    ) {}

    ngOnInit(): void {
        this.loadAccounts();
    }

    async loadAccounts(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.socialMediaService.getAccounts();
            console.log('SocialMedia Accounts response:', response);
            this.accounts = this.extractArray(response);
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
        this.form = { name: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(account: SocialMediaAccount): void {
        this.editMode = true;
        this.selectedAccount = account;
        this.form = {
            name: account.name,
            isBlocked: account.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedAccount) {
                const req: UpdateSocialMediaAccountRequest = {
                    name: this.form.name,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.socialMediaService.updateAccount(this.selectedAccount.id, req);
            } else {
                const req: CreateSocialMediaAccountRequest = {
                    name: this.form.name,
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

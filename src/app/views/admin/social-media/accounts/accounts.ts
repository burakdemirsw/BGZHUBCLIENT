import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { UsersService } from '@/app/core/services/users.service';
import {
    SocialMediaAccount,
    CreateSocialMediaAccountRequest,
    UpdateSocialMediaAccountRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-social-media-accounts-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './accounts.html',
})
export class SocialMediaAccountsPage implements OnInit {
    accounts: SocialMediaAccount[] = [];
    users: any[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedAccount: SocialMediaAccount | null = null;

    form: any = {
        userId: '',
        name: '',
        isBlocked: false,
    };

    constructor(
        private socialMediaService: SocialMediaService,
        private usersService: UsersService,
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.loadAccounts();
    }

    loadUsers(): void {
        this.usersService.getAll().subscribe({
            next: (response: any) => {
                this.users = this.extractArray(response);
            },
        });
    }

    loadAccounts(): void {
        this.loading = true;
        this.socialMediaService.getAccounts().subscribe({
            next: (response: any) => {
                console.log('SocialMedia Accounts response:', response);
                this.accounts = this.extractArray(response);
                this.loading = false;
            },
            error: (err) => {
                console.error('SocialMedia Accounts error:', err);
                this.loading = false;
            },
        });
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    getUserName(userId: string): string {
        const user = this.users.find(u => u.id === userId);
        return user ? (user.userName ?? user.email ?? user.name ?? '-') : '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedAccount = null;
        this.form = { userId: '', name: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(account: SocialMediaAccount): void {
        this.editMode = true;
        this.selectedAccount = account;
        this.form = {
            userId: account.userId,
            name: account.name,
            isBlocked: account.isBlocked ?? false,
        };
        this.showModal = true;
    }

    save(): void {
        if (this.editMode && this.selectedAccount) {
            const req: UpdateSocialMediaAccountRequest = {
                userId: this.form.userId,
                name: this.form.name,
                isBlocked: this.form.isBlocked ?? false,
            };
            this.socialMediaService.updateAccount(this.selectedAccount.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadAccounts();
                },
            });
        } else {
            const req: CreateSocialMediaAccountRequest = {
                userId: this.form.userId,
                name: this.form.name,
            };
            this.socialMediaService.createAccount(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadAccounts();
                },
            });
        }
    }

    deleteAccount(account: SocialMediaAccount): void {
        if (confirm(`"${account.name}" hesabını silmek istediğinize emin misiniz?`)) {
            this.socialMediaService.deleteAccount(account.id).subscribe({
                next: () => this.loadAccounts(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

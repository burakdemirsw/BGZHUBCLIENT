import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import { UsersService } from '@/app/core/services/users.service';
import {
    SocialMediaAccount,
    UserSocialMediaAccount,
    CreateUserSocialMediaAccountRequest,
    UpdateUserSocialMediaAccountRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-user-social-media-accounts-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-accounts.html',
})
export class UserSocialMediaAccountsPage implements OnInit {
    userAccounts: UserSocialMediaAccount[] = [];
    filteredUserAccounts: UserSocialMediaAccount[] = [];
    accounts: SocialMediaAccount[] = [];
    users: any[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedUserAccount: UserSocialMediaAccount | null = null;
    filterUserId: string = '';
    filterAccountId: string = '';

    form: any = {
        userId: '',
        socialMediaAccountId: '',
        isBlocked: false,
    };

    constructor(
        private socialMediaService: SocialMediaService,
        private usersService: UsersService,
    ) {}

    ngOnInit(): void {
        this.loadUsers();
        this.loadAccounts();
        this.loadUserAccounts();
    }

    async loadUsers(): Promise<void> {
        try {
            const response = await this.usersService.getAll();
            this.users = this.extractArray(response);
        } catch (err) {
            console.error('Users error:', err);
        }
    }

    async loadAccounts(): Promise<void> {
        try {
            const response = await this.socialMediaService.getAccountsPaged(1, 1000, '');
            const data = response?.data || response;
            this.accounts = this.extractArray(data?.items || data);
        } catch (err) {
            console.error('Accounts error:', err);
        }
    }

    async loadUserAccounts(): Promise<void> {
        this.loading = true;
        try {
            let response;
            if (this.filterUserId) {
                response = await this.socialMediaService.getUserAccountsByUser(this.filterUserId);
            } else if (this.filterAccountId) {
                response = await this.socialMediaService.getUserAccountsByAccount(this.filterAccountId);
            } else {
                response = await this.socialMediaService.getUserAccounts();
            }
            console.log('User Accounts response:', response);
            const data = response?.data || response;
            this.userAccounts = this.extractArray(data?.items || data);
            this.applyFilters();
        } catch (err) {
            console.error('User Accounts error:', err);
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

    applyFilters(): void {
        let result = [...this.userAccounts];
        
        if (this.filterUserId) {
            result = result.filter(ua => ua.userId === this.filterUserId);
        }
        if (this.filterAccountId) {
            result = result.filter(ua => ua.socialMediaAccountId === this.filterAccountId);
        }
        
        this.filteredUserAccounts = result;
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    clearFilters(): void {
        this.filterUserId = '';
        this.filterAccountId = '';
        this.applyFilters();
    }

    getUserName(userId: string): string {
        const user = this.users.find(u => u.id === userId);
        return user ? `${user.name} ${user.lastName}` : '-';
    }

    getAccountName(accountId: string): string {
        return this.accounts.find(a => a.id === accountId)?.name ?? '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedUserAccount = null;
        this.form = {
            userId: this.filterUserId || '',
            socialMediaAccountId: this.filterAccountId || '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(userAccount: UserSocialMediaAccount): void {
        this.editMode = true;
        this.selectedUserAccount = userAccount;
        this.form = {
            userId: userAccount.userId,
            socialMediaAccountId: userAccount.socialMediaAccountId,
            isBlocked: userAccount.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedUserAccount) {
                const req: UpdateUserSocialMediaAccountRequest = {
                    userId: this.form.userId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.socialMediaService.updateUserAccount(this.selectedUserAccount.id, req);
            } else {
                const req: CreateUserSocialMediaAccountRequest = {
                    userId: this.form.userId,
                    socialMediaAccountId: this.form.socialMediaAccountId,
                };
                await this.socialMediaService.createUserAccount(req);
            }
            this.showModal = false;
            await this.loadUserAccounts();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteUserAccount(userAccount: UserSocialMediaAccount): Promise<void> {
        const userName = this.getUserName(userAccount.userId);
        const accountName = this.getAccountName(userAccount.socialMediaAccountId);
        if (confirm(`"${userName}" kullanıcısının "${accountName}" hesap atamasını silmek istediğinize emin misiniz?`)) {
            try {
                console.log('Deleting user account with ID:', userAccount.id);
                console.log('API URL will be: /api/SocialMedia/delete/user-accounts/' + userAccount.id);
                await this.socialMediaService.deleteUserAccount(userAccount.id);
                console.log('Delete successful');
                await this.loadUserAccounts();
            } catch (err: any) {
                console.error('Delete error:', err);
                console.error('Error status:', err.status);
                console.error('Error message:', err.message);
                console.error('Error details:', err.error);
                alert(`Silme işlemi başarısız: ${err.status} - ${err.message || 'Bilinmeyen hata'}`);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}
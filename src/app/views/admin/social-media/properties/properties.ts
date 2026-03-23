import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import {
    SocialMediaAccount,
    UserSocialMediaAccount,
    SocialMediaAccountProperty,
    CreateSocialMediaAccountPropertyRequest,
    UpdateSocialMediaAccountPropertyRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-social-media-properties-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './properties.html',
})
export class SocialMediaPropertiesPage implements OnInit {
    properties: SocialMediaAccountProperty[] = [];
    accounts: SocialMediaAccount[] = [];
    userAccounts: UserSocialMediaAccount[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedProperty: SocialMediaAccountProperty | null = null;
    filterUserAccountId: string = '';

    // Server-side pagination
    searchTerm = '';
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalCount = 0;
    totalPagesArray: number[] = [];
    private allFilteredProperties: SocialMediaAccountProperty[] = [];

    form: any = {
        userSocialMediaAccountId: '',
        key: '',
        value: '',
        isBlocked: false,
    };

    constructor(
        private socialMediaService: SocialMediaService
    ) {}

    ngOnInit(): void {
        this.loadAccounts();
        this.loadUserAccounts();
        this.loadProperties();
    }

    async loadAccounts(): Promise<void> {
        try {
            const response = await this.socialMediaService.getAccountsPaged({ pageNumber: 1, pageSize: 1000 });
            const paged = response?.data;
            this.accounts = paged?.items ?? [];
        } catch (err) {
            console.error('Accounts error:', err);
        }
    }

    async loadUserAccounts(): Promise<void> {
        try {
            const response = await this.socialMediaService.getUserAccounts();
            this.userAccounts = this.extractArray(response?.data);
        } catch (err) {
            console.error('User Accounts error:', err);
        }  
    }

    async loadProperties(): Promise<void> {
        this.loading = true;
        try {
            if (this.filterUserAccountId) {
                const response = await this.socialMediaService.getPropertiesByAccount(this.filterUserAccountId);
                this.allFilteredProperties = this.extractArray(response?.data);
                this.applyClientPaging();
            } else {
                const response = await this.socialMediaService.getPropertiesPaged({
                    pageNumber: this.currentPage,
                    pageSize: this.pageSize,
                    searchTerm: this.searchTerm,
                });
                const paged = response?.data;
                this.properties = paged?.items ?? [];
                this.totalCount = paged?.totalCount ?? this.properties.length;
                this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
                this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
            }
        } catch (err) {
            console.error('Properties error:', err);
        } finally {
            this.loading = false;
        }
    }

    private applyClientPaging(): void {
        const q = (this.searchTerm || '').toLowerCase();
        let filtered = this.allFilteredProperties;
        if (q) {
            filtered = filtered.filter(p =>
                (p.key || '').toLowerCase().includes(q) ||
                (p.value || '').toLowerCase().includes(q)
            );
        }
        this.totalCount = filtered.length;
        this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.properties = filtered.slice(start, start + this.pageSize);
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
        if (response?.items) return response.items;
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadProperties();
    }

    onSearchChange(): void {
        this.currentPage = 1;
        if (this.filterUserAccountId) {
            this.applyClientPaging();
        } else {
            this.loadProperties();
        }
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        if (this.filterUserAccountId) {
            this.applyClientPaging();
        } else {
            this.loadProperties();
        }
    }

    getAccountName(accountId: string): string {
        return this.accounts.find(a => a.id === accountId)?.name ?? '-';
    }

    getUserAccountName(userAccountId: string): string {
        const userAccount = this.userAccounts.find(ua => ua.id === userAccountId);
        if (!userAccount) return '-';
        const account = this.accounts.find(a => a.id === userAccount.socialMediaAccountId);
        return account?.name ?? '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedProperty = null;
        this.form = {
            userSocialMediaAccountId: this.filterUserAccountId || '',
            key: '',
            value: '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(prop: SocialMediaAccountProperty): void {
        this.editMode = true;
        this.selectedProperty = prop;
        this.form = {
            userSocialMediaAccountId: prop.userSocialMediaAccountId,
            key: prop.key,
            value: prop.value,
            isBlocked: prop.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedProperty) {
                const req: UpdateSocialMediaAccountPropertyRequest = {
                    userSocialMediaAccountId: this.form.userSocialMediaAccountId,
                    key: this.form.key,
                    value: this.form.value,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.socialMediaService.updateProperty(this.selectedProperty.id, req);
            } else {
                const req: CreateSocialMediaAccountPropertyRequest = {
                    userSocialMediaAccountId: this.form.userSocialMediaAccountId,
                    key: this.form.key,
                    value: this.form.value,
                };
                await this.socialMediaService.createProperty(req);
            }
            this.showModal = false;
            await this.loadProperties();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteProperty(prop: SocialMediaAccountProperty): Promise<void> {
        if (confirm(`"${prop.key}" özelliğini silmek istediğinize emin misiniz?`)) {
            try {
                await this.socialMediaService.deleteProperty(prop.id);   
                await this.loadProperties();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

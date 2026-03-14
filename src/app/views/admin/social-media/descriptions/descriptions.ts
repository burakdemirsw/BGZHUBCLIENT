import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import {
    SocialMediaAccount,
    SocialMediaAccountDescription,
    CreateSocialMediaAccountDescriptionRequest,
    UpdateSocialMediaAccountDescriptionRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-social-media-descriptions-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './descriptions.html',
})
export class SocialMediaDescriptionsPage implements OnInit {
    descriptions: SocialMediaAccountDescription[] = [];
    accounts: SocialMediaAccount[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedDescription: SocialMediaAccountDescription | null = null;
    filterAccountId: string = '';

    form: any = {
        socialMediaAccountId: '',
        langCode: '',
        description: '',
        isBlocked: false,
    };

    constructor(private socialMediaService: SocialMediaService) {}

    ngOnInit(): void {
        this.loadAccounts();
        this.loadDescriptions();
    }

    async loadAccounts(): Promise<void> {
        try {
            const response = await this.socialMediaService.getAccounts();
            this.accounts = this.extractArray(response);
        } catch (err) {
            console.error('Accounts error:', err);
        }
    }

    async loadDescriptions(): Promise<void> {
        this.loading = true;
        try {
            let response;
            if (this.filterAccountId) {
                response = await this.socialMediaService.getDescriptionsByAccount(this.filterAccountId);
            } else {
                response = await this.socialMediaService.getDescriptions();
            }
            console.log('Descriptions response:', response);
            this.descriptions = this.extractArray(response);
        } catch (err) {
            console.error('Descriptions error:', err);
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

    onFilterChange(): void {
        this.loadDescriptions();
    }

    getAccountName(accountId: string): string {
        return this.accounts.find(a => a.id === accountId)?.name ?? '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedDescription = null;
        this.form = {
            socialMediaAccountId: this.filterAccountId || '',
            langCode: '',
            description: '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(desc: SocialMediaAccountDescription): void {
        this.editMode = true;
        this.selectedDescription = desc;
        this.form = {
            socialMediaAccountId: desc.socialMediaAccountId,
            langCode: desc.langCode,
            description: desc.description,
            isBlocked: desc.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedDescription) {
                const req: UpdateSocialMediaAccountDescriptionRequest = {
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    langCode: this.form.langCode,
                    description: this.form.description,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.socialMediaService.updateDescription(this.selectedDescription.id, req);
            } else {
                const req: CreateSocialMediaAccountDescriptionRequest = {
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    langCode: this.form.langCode,
                    description: this.form.description,
                };
                await this.socialMediaService.createDescription(req);
            }
            this.showModal = false;
            await this.loadDescriptions();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteDescription(desc: SocialMediaAccountDescription): Promise<void> {
        if (confirm('Bu açıklamayı silmek istediğinize emin misiniz?')) {
            try {
                await this.socialMediaService.deleteDescription(desc.id);
                await this.loadDescriptions();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

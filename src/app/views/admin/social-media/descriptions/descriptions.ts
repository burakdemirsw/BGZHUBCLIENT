import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import {
    SocialMediaAccount,
    SocialMediaAccountDescription,
    CreateSocialMediaAccountDescriptionRequest,
    UpdateSocialMediaAccountDescriptionRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-social-media-descriptions-page',
    imports: [CommonModule, FormsModule, PageTitle],
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

    loadAccounts(): void {
        this.socialMediaService.getAccounts().subscribe({
            next: (response: any) => {
                this.accounts = this.extractArray(response);
            },
        });
    }

    loadDescriptions(): void {
        this.loading = true;
        if (this.filterAccountId) {
            this.socialMediaService.getDescriptionsByAccount(this.filterAccountId).subscribe({
                next: (response: any) => {
                    console.log('Descriptions response:', response);
                    this.descriptions = this.extractArray(response);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Descriptions error:', err);
                    this.loading = false;
                },
            });
        } else {
            this.socialMediaService.getDescriptions().subscribe({
                next: (response: any) => {
                    console.log('Descriptions response:', response);
                    this.descriptions = this.extractArray(response);
                    this.loading = false;
                },
                error: (err) => {
                    console.error('Descriptions error:', err);
                    this.loading = false;
                },
            });
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

    save(): void {
        if (this.editMode && this.selectedDescription) {
            const req: UpdateSocialMediaAccountDescriptionRequest = {
                socialMediaAccountId: this.form.socialMediaAccountId,
                langCode: this.form.langCode,
                description: this.form.description,
                isBlocked: this.form.isBlocked ?? false,
            };
            this.socialMediaService.updateDescription(this.selectedDescription.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadDescriptions();
                },
            });
        } else {
            const req: CreateSocialMediaAccountDescriptionRequest = {
                socialMediaAccountId: this.form.socialMediaAccountId,
                langCode: this.form.langCode,
                description: this.form.description,
            };
            this.socialMediaService.createDescription(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadDescriptions();
                },
            });
        }
    }

    deleteDescription(desc: SocialMediaAccountDescription): void {
        if (confirm('Bu açıklamayı silmek istediğinize emin misiniz?')) {
            this.socialMediaService.deleteDescription(desc.id).subscribe({
                next: () => this.loadDescriptions(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

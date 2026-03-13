import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { SocialMediaService } from '@/app/core/services/social-media.service';
import {
    SocialMediaAccount,
    SocialMediaAccountProperty,
    CreateSocialMediaAccountPropertyRequest,
    UpdateSocialMediaAccountPropertyRequest,
} from '@/app/core/models/social-media/social-media.models';

@Component({
    selector: 'app-social-media-properties-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './properties.html',
})
export class SocialMediaPropertiesPage implements OnInit {
    properties: SocialMediaAccountProperty[] = [];
    accounts: SocialMediaAccount[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedProperty: SocialMediaAccountProperty | null = null;
    filterAccountId: string = '';

    form: any = {
        socialMediaAccountId: '',
        key: '',
        value: '',
        isBlocked: false,
    };

    constructor(private socialMediaService: SocialMediaService) {}

    ngOnInit(): void {
        this.loadAccounts();
        this.loadProperties();
    }

    async loadAccounts(): Promise<void> {
        try {
            const response = await this.socialMediaService.getAccounts();
            this.accounts = this.extractArray(response);
        } catch (err) {
            console.error('Accounts error:', err);
        }
    }

    async loadProperties(): Promise<void> {
        this.loading = true;
        try {
            let response;
            if (this.filterAccountId) {
                response = await this.socialMediaService.getPropertiesByAccount(this.filterAccountId);
            } else {
                response = await this.socialMediaService.getProperties();
            }
            console.log('Properties response:', response);
            this.properties = this.extractArray(response);
        } catch (err) {
            console.error('Properties error:', err);
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
        this.loadProperties();
    }

    getAccountName(accountId: string): string {
        return this.accounts.find(a => a.id === accountId)?.name ?? '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedProperty = null;
        this.form = {
            socialMediaAccountId: this.filterAccountId || '',
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
            socialMediaAccountId: prop.socialMediaAccountId,
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
                    socialMediaAccountId: this.form.socialMediaAccountId,
                    key: this.form.key,
                    value: this.form.value,
                    isBlocked: this.form.isBlocked ?? false,
                };
                await this.socialMediaService.updateProperty(this.selectedProperty.id, req);
            } else {
                const req: CreateSocialMediaAccountPropertyRequest = {
                    socialMediaAccountId: this.form.socialMediaAccountId,
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

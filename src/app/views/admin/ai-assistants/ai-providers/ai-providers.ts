import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { AiProvidersService } from '@/app/core/services/ai-providers.service';
import { AiProvider, CreateAiProviderRequest, UpdateAiProviderRequest } from '@/app/core/models/ai-assistant/ai-provider.models';

@Component({
    selector: 'app-ai-providers-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './ai-providers.html',
})
export class AiProvidersPage implements OnInit {
    providers: AiProvider[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedProvider: AiProvider | null = null;

    form: any = {
        firmDescription: '',
        isBlocked: false,
    };

    constructor(private aiService: AiProvidersService) {}

    ngOnInit(): void {
        this.loadProviders();
    }

    async loadProviders(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.aiService.getProviders();
            this.providers = this.extractArray(response);
        } catch (err) {
            console.error('AiProviders load error:', err);
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
        this.selectedProvider = null;
        this.form = { firmDescription: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(provider: AiProvider): void {
        this.editMode = true;
        this.selectedProvider = provider;
        this.form = {
            firmDescription: provider.firmDescription,
            isBlocked: provider.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedProvider) {
                const req: UpdateAiProviderRequest = {
                    firmDescription: this.form.firmDescription,
                    isBlocked: this.form.isBlocked,
                };
                await this.aiService.updateProvider(this.selectedProvider.id, req);
            } else {
                const req: CreateAiProviderRequest = {
                    firmDescription: this.form.firmDescription,
                };
                await this.aiService.createProvider(req);
            }
            this.showModal = false;
            await this.loadProviders();
        } catch (err: any) {
            console.error('Save error:', err);
            // Backend CreatedAtAction route hatası — kayıt oluşmuş olabilir
            if (err.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                this.showModal = false;
                await this.loadProviders();
                return;
            }
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteProvider(provider: AiProvider): Promise<void> {
        if (confirm(`"${provider.firmDescription}" sağlayıcısını silmek istediğinize emin misiniz?`)) {
            try {
                await this.aiService.deleteProvider(provider.id);
                await this.loadProviders();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { Integration, CreateIntegrationRequest, UpdateIntegrationRequest } from '@/app/core/models/integration/integration.models';

@Component({
    selector: 'app-integrations-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './integrations.html',
})
export class IntegrationsPage implements OnInit {
    integrations: Integration[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedIntegration: Integration | null = null;

    form: any = {
        integrationDescription: '',
    };

    constructor(private integrationService: IntegrationsService) {}

    ngOnInit(): void {
        this.loadIntegrations();
    }

    async loadIntegrations(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.integrationService.getAll();
            console.log('Integrations response:', response);
            this.integrations = this.extractArray(response);
        } catch (err) {
            console.error('Integrations error:', err);
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
        this.selectedIntegration = null;
        this.form = { integrationDescription: '' };
        this.showModal = true;
    }

    openEdit(integration: Integration): void {
        this.editMode = true;
        this.selectedIntegration = integration;
        this.form = {
            integrationDescription: integration.integrationDescription,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedIntegration) {
                const req: UpdateIntegrationRequest = {
                    integrationDescription: this.form.integrationDescription,
                };
                console.log('Update request:', req);
                const res = await this.integrationService.update(this.selectedIntegration.id, req);
                console.log('Update response:', res);
            } else {
                const req: CreateIntegrationRequest = {
                    integrationDescription: this.form.integrationDescription,
                };
                console.log('Create request:', req);
                const res = await this.integrationService.create(req);
                console.log('Create response:', res);
            }
            this.showModal = false;
            await this.loadIntegrations();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg = err.status === 0
                ? `Sunucuya bağlanılamadı (CORS veya ağ hatası).\nURL: ${err.url}\nMesaj: ${err.message}`
                : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteIntegration(integration: Integration): Promise<void> {
        if (confirm(`"${integration.integrationDescription}" entegrasyonunu silmek istediğinize emin misiniz?`)) {
            try {
                await this.integrationService.delete(integration.id);
                await this.loadIntegrations();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

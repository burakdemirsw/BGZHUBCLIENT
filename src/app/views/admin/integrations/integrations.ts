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

    loadIntegrations(): void {
        this.loading = true;
        this.integrationService.getAll().subscribe({
            next: (response: any) => {
                console.log('Integrations response:', response);
                this.integrations = this.extractArray(response);
                this.loading = false;
            },
            error: (err) => {
                console.error('Integrations error:', err);
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

    save(): void {
        if (this.editMode && this.selectedIntegration) {
            const req: UpdateIntegrationRequest = {
                integrationDescription: this.form.integrationDescription,
            };
            this.integrationService.update(this.selectedIntegration.id, req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadIntegrations();
                },
            });
        } else {
            const req: CreateIntegrationRequest = {
                integrationDescription: this.form.integrationDescription,
            };
            this.integrationService.create(req).subscribe({
                next: () => {
                    this.showModal = false;
                    this.loadIntegrations();
                },
            });
        }
    }

    deleteIntegration(integration: Integration): void {
        if (confirm(`"${integration.integrationDescription}" entegrasyonunu silmek istediğinize emin misiniz?`)) {
            this.integrationService.delete(integration.id).subscribe({
                next: () => this.loadIntegrations(),
            });
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

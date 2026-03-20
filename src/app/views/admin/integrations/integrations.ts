import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { IntegrationTypesService } from '@/app/core/services/integration-types.service';
import { Integration, CreateIntegrationRequest, UpdateIntegrationRequest } from '@/app/core/models/integration/integration.models';
import { IntegrationType } from '@/app/core/models/integration/integration-type.models';

@Component({
    selector: 'app-integrations-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integrations.html',
})
export class IntegrationsPage implements OnInit {
    integrations: Integration[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedIntegration: Integration | null = null;

    // Datatable
    filterText = '';
    filteredItems: Integration[] = [];
    pagedItems: Integration[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Entegrasyon tipleri
    integrationTypes: IntegrationType[] = [];

    form: any = {
        integrationDescription: '',
        integrationTypeId: '',
        photoUrl: '',
    };

    constructor(
        private integrationService: IntegrationsService,
        private integrationTypesService: IntegrationTypesService,
    ) {}

    ngOnInit(): void {
        this.loadIntegrationTypes();
        this.loadIntegrations();
    }

    async loadIntegrationTypes(): Promise<void> {
        try {
            const response = await this.integrationTypesService.getAll();
            this.integrationTypes = this.extractArray(response);
        } catch (err) {
            console.error('IntegrationTypes load error:', err);
        }
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.applyFilterAndPaging();
    }

    setPage(page: number): void {
        if (page < 1 || page > this.totalPages) return;   
        this.currentPage = page;
        this.applyFilterAndPaging();
    }

    applyFilterAndPaging(): void {
        const q = (this.filterText || '').toLowerCase();
        this.filteredItems = this.integrations.filter((i: any) =>
            i.integrationDescription.toLowerCase().includes(q) ||
            (i.integrationTypeName || '').toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadIntegrations(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.integrationService.getPaged(1, 1000);
            const pagedData = response?.data || response;
            this.integrations = this.extractArray(pagedData?.items || pagedData);
            this.applyFilterAndPaging();
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
        this.form = { integrationDescription: '', integrationTypeId: '', photoUrl: '' };
        this.showModal = true;
    }

    openEdit(integration: Integration): void {
        this.editMode = true;
        this.selectedIntegration = integration;
        this.form = {
            integrationDescription: integration.integrationDescription,
            integrationTypeId: integration.integrationTypeId || '',
            photoUrl: integration.photoUrl || '',
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedIntegration) {
                const req: UpdateIntegrationRequest = {
                    integrationDescription: this.form.integrationDescription,
                    integrationTypeId: this.form.integrationTypeId || undefined,
                    photoUrl: this.form.photoUrl,
                };
                console.log('Update request:', req);
                const res = await this.integrationService.update(this.selectedIntegration.id, req);
                console.log('Update response:', res);
            } else {
                const req: CreateIntegrationRequest = {
                    integrationDescription: this.form.integrationDescription,
                    integrationTypeId: this.form.integrationTypeId || undefined,
                    photoUrl: this.form.photoUrl,
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

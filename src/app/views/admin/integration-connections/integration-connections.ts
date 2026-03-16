import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationConnectionsService } from '@/app/core/services/integration-connections.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { IntegrationConnectionTypesService } from '@/app/core/services/integration-connection-types.service';
import {
    IntegrationConnection,
    CreateIntegrationConnectionRequest,
    UpdateIntegrationConnectionRequest,
} from '@/app/core/models/integration/integration-connection.models';
import { Integration } from '@/app/core/models/integration/integration.models';
import { IntegrationConnectionType } from '@/app/core/models/integration/integration-connection-type.models';

@Component({
    selector: 'app-integration-connections-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integration-connections.html',
})
export class IntegrationConnectionsPage implements OnInit {
    items: IntegrationConnection[] = [];
    integrations: Integration[] = [];
    connectionTypes: IntegrationConnectionType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: IntegrationConnection | null = null;

    // Datatable
    filterText = '';
    filteredItems: IntegrationConnection[] = [];
    pagedItems: IntegrationConnection[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        integrationId: '',
        connectionTypeId: '',
        name: '',
        url: '',
        isBlocked: false,
    };

    constructor(
        private service: IntegrationConnectionsService,
        private integrationsService: IntegrationsService,
        private connectionTypesService: IntegrationConnectionTypesService
    ) {}

    ngOnInit(): void {
        this.loadLookups();
        this.loadItems();
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
        this.filteredItems = this.items.filter(
            i =>
                (i.name || '').toLowerCase().includes(q) ||
                (i.url || '').toLowerCase().includes(q) ||
                this.getIntegrationName(i.integrationId).toLowerCase().includes(q) ||
                this.getConnectionTypeName(i.connectionTypeId).toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadLookups(): Promise<void> {
        try {
            const [intRes, ctRes] = await Promise.all([
                this.integrationsService.getAll(),
                this.connectionTypesService.getAll(),
            ]);
            this.integrations = this.extractArray(intRes);
            this.connectionTypes = this.extractArray(ctRes);
        } catch (err) {
            console.error('Lookup load error:', err);
        }
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            console.log('IntegrationConnections response:', response);
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('IntegrationConnections error:', err);
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

    getIntegrationName(id: string): string {
        const item = this.integrations.find(i => i.id === id);
        return item?.integrationDescription || id || '-';
    }

    getConnectionTypeName(id: string): string {
        const item = this.connectionTypes.find(i => i.id === id);
        return item?.name || id || '-';
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = {
            integrationId: '',
            connectionTypeId: '',
            name: '',
            url: '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(item: IntegrationConnection): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            integrationId: item.integrationId,
            connectionTypeId: item.connectionTypeId,
            name: item.name,
            url: item.url || '',
            isBlocked: item.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateIntegrationConnectionRequest = {
                    integrationId: this.form.integrationId,
                    connectionTypeId: this.form.connectionTypeId,
                    name: this.form.name,
                    url: this.form.url,
                    isBlocked: this.form.isBlocked ?? false,
                };
                console.log('Update request:', req);
                const res = await this.service.update(this.selectedItem.id, req);
                console.log('Update response:', res);
            } else {
                const req: CreateIntegrationConnectionRequest = {
                    integrationId: this.form.integrationId,
                    connectionTypeId: this.form.connectionTypeId,
                    name: this.form.name,
                    url: this.form.url,
                };
                console.log('Create request:', req);
                const res = await this.service.create(req);
                console.log('Create response:', res);
            }
            this.showModal = false;
            await this.loadItems();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı (CORS veya ağ hatası).\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteItem(item: IntegrationConnection): Promise<void> {
        const name = this.getIntegrationName(item.integrationId) + ' - ' + this.getConnectionTypeName(item.connectionTypeId);
        if (confirm(`"${name}" bağlantısını silmek istediğinize emin misiniz?`)) {
            try {
                await this.service.delete(item.id);
                await this.loadItems();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    closeModal(): void {
        this.showModal = false;
    }
}

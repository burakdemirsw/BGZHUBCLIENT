import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationConnectionsService } from '@/app/core/services/integration-connections.service';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { IntegrationConnectionTypesService } from '@/app/core/services/integration-connection-types.service';
import {
    IntegrationConnectionResponse,
    CreateIntegrationConnectionRequest,
    UpdateIntegrationConnectionRequest,
} from '@/app/core/models/integration/integration-connection.models';
import { Integration } from '@/app/core/models/integration/integration.models';
import { IntegrationConnectionType } from '@/app/core/models/integration/integration-connection-type.models';
import { AuthStateService } from '@core/services/auth-state.service';

@Component({
    selector: 'app-integration-connections-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integration-connections.html',
})
export class IntegrationConnectionsPage implements OnInit {
    items: IntegrationConnectionResponse[] = [];
    integrations: Integration[] = [];
    connectionTypes: IntegrationConnectionType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: IntegrationConnectionResponse | null = null;

    // Datatable
    filterText = '';
    filteredItems: IntegrationConnectionResponse[] = [];
    pagedItems: IntegrationConnectionResponse[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        integrationUserId: '',
        connectionTypeId: '',
        companyId: '',
        name: '',
        url: '',
        isBlocked: false,
    };

    constructor(
        private service: IntegrationConnectionsService,
        private integrationsService: IntegrationsService,
        private connectionTypesService: IntegrationConnectionTypesService,
        private authStateService: AuthStateService
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
                (i.integrationDescription || '').toLowerCase().includes(q) ||
                (i.connectionTypeName || '').toLowerCase().includes(q)
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
            const response = await this.service.getPaged({ companyId: this.authStateService.profile?.companyId ?? '', pageNumber: 1, pageSize: 1000 });
            //console.log('IntegrationConnections response:', response);
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
        if (response?.data) {
            if (Array.isArray(response.data)) return response.data;
            if (response.data?.items) return response.data.items;
            if (response.data?.$values) return response.data.$values;
            return [response.data];
        }
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
        
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const companyId = profile.companyId || '';

        this.form = {
            integrationUserId: '',
            connectionTypeId: '',
            companyId: companyId,
            name: '',
            url: '',
            isBlocked: false,
        };
        this.showModal = true;
    }

    openEdit(item: IntegrationConnectionResponse): void {
        this.editMode = true;
        this.selectedItem = item;
        
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const companyId = profile.companyId || '';

        this.form = {
            integrationUserId: item.integrationUserId,
            connectionTypeId: item.connectionTypeId,
            companyId: item.companyId || companyId,
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
                    integrationUserId: this.form.integrationUserId,
                    connectionTypeId: this.form.connectionTypeId,
                    companyId: this.form.companyId,
                    name: this.form.name,
                    url: this.form.url,
                    isBlocked: this.form.isBlocked ?? false,
                };
                //console.log('Update request:', req);
                const res = await this.service.update(this.selectedItem.id, req);
                //console.log('Update response:', res);
            } else {
                const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
                const req: CreateIntegrationConnectionRequest = {
                    userId: profile.userId || '',
                    integrationUserId: this.form.integrationUserId,
                    connectionTypeId: this.form.connectionTypeId,
                    companyId: this.form.companyId,
                    name: this.form.name,
                    url: this.form.url,
                };
                //console.log('Create request:', req);
                const res = await this.service.create(req);
                //console.log('Create response:', res);
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

    async deleteItem(item: IntegrationConnectionResponse): Promise<void> {
        const name = this.getIntegrationName(item.integrationUserId) + ' - ' + this.getConnectionTypeName(item.connectionTypeId);
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

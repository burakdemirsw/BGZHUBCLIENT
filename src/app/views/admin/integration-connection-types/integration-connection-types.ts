import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationConnectionTypesService } from '@/app/core/services/integration-connection-types.service';
import {
    IntegrationConnectionType,
    CreateIntegrationConnectionTypeRequest,
    UpdateIntegrationConnectionTypeRequest,
} from '@/app/core/models/integration/integration-connection-type.models';

@Component({
    selector: 'app-integration-connection-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integration-connection-types.html',
})
export class IntegrationConnectionTypesPage implements OnInit {
    items: IntegrationConnectionType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: IntegrationConnectionType | null = null;

    // Datatable
    filterText = '';
    filteredItems: IntegrationConnectionType[] = [];
    pagedItems: IntegrationConnectionType[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        connectionTypeCode: '',
        name: '',
        description: '',
        isBlocked: false,
    };

    constructor(private service: IntegrationConnectionTypesService) {}

    ngOnInit(): void {
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
                i.name.toLowerCase().includes(q) ||
                i.connectionTypeCode.toLowerCase().includes(q) ||
                (i.description || '').toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadItems(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.service.getAll();
            //console.log('IntegrationConnectionTypes response:', response);
            this.items = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('IntegrationConnectionTypes error:', err);
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
        this.selectedItem = null;
        this.form = { connectionTypeCode: '', name: '', description: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: IntegrationConnectionType): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            connectionTypeCode: item.connectionTypeCode,
            name: item.name,
            description: item.description || '',
            isBlocked: item.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateIntegrationConnectionTypeRequest = {
                    connectionTypeCode: this.form.connectionTypeCode,
                    name: this.form.name,
                    description: this.form.description,
                    isBlocked: this.form.isBlocked ?? false,
                };
                //console.log('Update request:', req);
                const res = await this.service.update(this.selectedItem.id, req);
                //console.log('Update response:', res);
            } else {
                const req: CreateIntegrationConnectionTypeRequest = {
                    connectionTypeCode: this.form.connectionTypeCode,
                    name: this.form.name,
                    description: this.form.description,
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

    async deleteItem(item: IntegrationConnectionType): Promise<void> {
        if (confirm(`"${item.name}" bağlantı tipini silmek istediğinize emin misiniz?`)) {
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

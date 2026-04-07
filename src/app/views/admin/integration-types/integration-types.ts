import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationTypesService } from '@/app/core/services/integration-types.service';
import { AuthStateService } from '@core/services/auth-state.service';
import {
    IntegrationType,
    CreateIntegrationTypeRequest,
    UpdateIntegrationTypeRequest,
} from '@/app/core/models/integration/integration-type.models';

@Component({
    selector: 'app-integration-types-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integration-types.html',
})
export class IntegrationTypesPage implements OnInit {
    items: IntegrationType[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedItem: IntegrationType | null = null;

    // Datatable
    filterText = '';
    filteredItems: IntegrationType[] = [];
    pagedItems: IntegrationType[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    form: any = {
        integrationTypeCode: '',
        name: '',
        description: '',
        isBlocked: false,
    };

    constructor(
        private integrationTypesService: IntegrationTypesService,
        private authStateService: AuthStateService,
    ) {}

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
                i.integrationTypeCode.toLowerCase().includes(q) ||
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
            const response = await this.integrationTypesService.getPaged({
                companyId: this.authStateService.profile?.companyId ?? '',
                pageNumber: 1,
                pageSize: 1000,
            });
            const paged = response?.data;
            this.items = paged?.items ?? [];
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('IntegrationTypes error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray(response: any): any[] {
        if (Array.isArray(response)) return response;
        if (response?.$values) return response.$values;
        if (response?.data) {
            if (Array.isArray(response.data)) return response.data;
            if (response.data?.$values) return response.data.$values;
            return [response.data];
        }
        if (response?.items) {
            if (Array.isArray(response.items)) return response.items;
            if (response.items?.$values) return response.items.$values;
            return response.items;
        }
        if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
        return [];
    }

    openCreate(): void {
        this.editMode = false;
        this.selectedItem = null;
        this.form = { integrationTypeCode: '', name: '', description: '', isBlocked: false };
        this.showModal = true;
    }

    openEdit(item: IntegrationType): void {
        this.editMode = true;
        this.selectedItem = item;
        this.form = {
            integrationTypeCode: item.integrationTypeCode,
            name: item.name,
            description: item.description || '',
            isBlocked: item.isBlocked ?? false,
        };
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedItem) {
                const req: UpdateIntegrationTypeRequest = {
                    integrationTypeCode: this.form.integrationTypeCode,
                    name: this.form.name,
                    description: this.form.description,
                    isBlocked: this.form.isBlocked ?? false,
                };
                //console.log('Update request:', req);
                const res = await this.integrationTypesService.update(this.selectedItem.id, req);
                //console.log('Update response:', res);
            } else {
                const req: CreateIntegrationTypeRequest = {
                    integrationTypeCode: this.form.integrationTypeCode,
                    name: this.form.name,
                    description: this.form.description,
                };
                //console.log('Create request:', req);
                const res = await this.integrationTypesService.create(req);
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

    async deleteItem(item: IntegrationType): Promise<void> {
        if (confirm(`"${item.name}" entegrasyon tipini silmek istediğinize emin misiniz?`)) {
            try {
                await this.integrationTypesService.delete(item.id);
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

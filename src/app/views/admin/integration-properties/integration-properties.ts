import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { UsersService } from '@/app/core/services/users.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { User } from '@/app/core/models/user/user.models';
import {
    IntegrationProperty,
    CreateIntegrationPropertyRequest,
    UpdateIntegrationPropertyRequest,
} from '@/app/core/models/integration/integration-property.models';
import { IntegrationUser } from '@/app/core/models/integration/integration-user.models';

@Component({
    selector: 'app-integration-properties-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './integration-properties.html',
})
export class IntegrationPropertiesPage implements OnInit {
    integrationUsers: IntegrationUser[] = [];
    users: User[] = [];
    properties: IntegrationProperty[] = [];
    loading = false;

    // Datatable
    filterText = '';
    filteredItems: IntegrationProperty[] = [];
    pagedItems: IntegrationProperty[] = [];
    currentPage = 1;
    pageSize = 10;
    totalPages = 1;
    totalPagesArray: number[] = [];

    // Modal
    showModal = false;
    editMode = false;
    selectedProperty: IntegrationProperty | null = null;

    form = {
        userId: '',
        integrationUserId: '',
        key: '',
        value: '',
    };

    constructor(
        private integrationsService: IntegrationsService,
        private usersService: UsersService,
        private authStateService: AuthStateService,
    ) {}

    ngOnInit(): void {
        this.loadData();
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
        this.filteredItems = this.properties.filter(
            p =>
                (p.key || '').toLowerCase().includes(q) ||
                (p.value || '').toLowerCase().includes(q) ||
                this.getUserName(p.userId).toLowerCase().includes(q)
        );
        this.totalPages = Math.max(1, Math.ceil(this.filteredItems.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        this.pagedItems = this.filteredItems.slice(start, start + this.pageSize);
    }

    async loadData(): Promise<void> {
        this.loading = true;
        try {
            const companyId = this.getCompanyId();
            const [usersResp, intUsersResp, propsResp] = await Promise.all([
                this.usersService.getAll({ pageNumber: 1, pageSize: 1000, companyId }),
                this.integrationsService.getIntegrationUsersPaged({ pageNumber: 1, pageSize: 1000, companyId }),
                this.integrationsService.getIntegrationProperties({ pageNumber: 1, pageSize: 1000, companyId }),
            ]);
            this.users = this.extractArray<User>(usersResp);
            this.integrationUsers = this.extractArray<IntegrationUser>(intUsersResp);
            this.properties = this.extractArray<IntegrationProperty>(propsResp);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('LoadData error:', err);
        } finally {
            this.loading = false;
        }
    }

    private extractArray<T>(response: unknown): T[] {
        if (!response || typeof response !== 'object') return [];

        const obj = response as {
            $values?: T[];
            data?: unknown;
            items?: T[];
            result?: unknown;
        };

        if (Array.isArray(response)) return response;
        if (Array.isArray(obj.$values)) return obj.$values;
        if (Array.isArray(obj.items)) return obj.items;

        const data = obj.data as
            | T[]
            | {
                  items?: T[];
                  $values?: T[];
                  data?: T[];
                  result?: T[];
              }
            | undefined;

        if (Array.isArray(data)) return data;
        if (data && typeof data === 'object') {
            if (Array.isArray(data.items)) return data.items;
            if (Array.isArray(data.$values)) return data.$values;
            if (Array.isArray(data.data)) return data.data;
            if (Array.isArray(data.result)) return data.result;
        }

        const result = obj.result as T[] | { items?: T[]; $values?: T[] } | undefined;
        if (Array.isArray(result)) return result;
        if (result && typeof result === 'object') {
            if (Array.isArray(result.items)) return result.items;
            if (Array.isArray(result.$values)) return result.$values;
        }

        return [];
    }

    // ── Yardımcılar ──
    getUserName(userId: string): string {
        const u = this.users.find(u => u.id === userId);
        return u ? `${u.name} ${u.lastName}` : '-';
    }

    getIntegrationUserName(integrationUserId: string): string {
        const iu = this.integrationUsers.find(iu => iu.id === integrationUserId);
        if (!iu) return '-';
        return iu.integrationDescription || this.getUserName(iu.userId);
    }

    // ── Modal ──
    openCreate(): void {
        this.editMode = false;
        this.selectedProperty = null;
        this.form = {
            userId: '',
            integrationUserId: '',
            key: '',
            value: '',
        };
        this.showModal = true;
    }

    openEdit(prop: IntegrationProperty): void {
        this.editMode = true;
        this.selectedProperty = prop;
        this.form = {
            userId: prop.userId,
            integrationUserId: prop.integrationUserId || '',
            key: prop.key,
            value: prop.value,
        };
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
    }

    // ── CRUD ──
    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedProperty) {
                const req: UpdateIntegrationPropertyRequest = {
                    userId: this.form.userId,
                    integrationUserId: this.form.integrationUserId || undefined,
                    companyId: this.getCompanyId(),
                    key: this.form.key,
                    value: this.form.value,
                    isBlocked: this.selectedProperty.isBlocked ?? false,
                };
                //console.log('Update request:', req);
                const res = await this.integrationsService.updateIntegrationProperty(this.selectedProperty.id, req);
                //console.log('Update response:', res);
            } else {
                const req: CreateIntegrationPropertyRequest = {
                    userId: this.form.userId,
                    integrationUserId: this.form.integrationUserId || undefined,
                    companyId: this.getCompanyId(),
                    key: this.form.key,
                    value: this.form.value,
                };
                //console.log('Create request:', req);
                const res = await this.integrationsService.createIntegrationProperty(req);
                //console.log('Create response:', res);
            }
            this.showModal = false;
            await this.refreshProperties();
        } catch (err: any) {
            console.error('Save error:', err);
            const msg =
                err.status === 0
                    ? `Sunucuya bağlanılamadı (CORS veya ağ hatası).\nURL: ${err.url}\nMesaj: ${err.message}`
                    : `Hata ${err.status}: ${err.error?.message || err.error?.title || JSON.stringify(err.error)}`;
            alert('İşlem hatası:\n' + msg);
        }
    }

    async deleteProperty(prop: IntegrationProperty): Promise<void> {
        if (confirm(`"${prop.key}" özelliğini silmek istediğinize emin misiniz?`)) {
            try {
                await this.integrationsService.deleteIntegrationProperty(prop.id);
                await this.refreshProperties();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    async toggleBlock(prop: IntegrationProperty): Promise<void> {
        try {
            const req: UpdateIntegrationPropertyRequest = {
                userId: prop.userId,
                integrationUserId: prop.integrationUserId,
                companyId: prop.companyId,
                key: prop.key,
                value: prop.value,
                isBlocked: !prop.isBlocked,
            };
            await this.integrationsService.updateIntegrationProperty(prop.id, req);
            await this.refreshProperties();
        } catch (err) {
            console.error('Toggle error:', err);
        }
    }

    private async refreshProperties(): Promise<void> {
        try {
            const resp = await this.integrationsService.getIntegrationProperties({
                pageNumber: 1,
                pageSize: 1000,
                companyId: this.getCompanyId(),
            });
            this.properties = this.extractArray<IntegrationProperty>(resp);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Refresh error:', err);
        }
    }

    private getCompanyId(): string {
        return this.authStateService.profile?.companyId || '';
    }
}

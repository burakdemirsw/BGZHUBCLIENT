import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { UsersService } from '@/app/core/services/users.service';
import { Integration } from '@/app/core/models/integration/integration.models';
import { User } from '@/app/core/models/user/user.models';
import { IntegrationProperty } from '@/app/core/models/integration/integration-property.models';

@Component({
    selector: 'app-integration-properties-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './integration-properties.html',
})
export class IntegrationPropertiesPage implements OnInit {
    integrations: Integration[] = [];
    users: User[] = [];
    properties: IntegrationProperty[] = [];
    loading = false;

    // Filtre
    filterIntegrationId: string = '';
    filterUserId: string = '';

    // Modal
    showModal = false;
    editMode = false;
    selectedProperty: IntegrationProperty | null = null;

    form = {
        integrationId: '',
        userId: '',
        key: '',
        value: '',
    };

    constructor(
        private integrationsService: IntegrationsService,
        private usersService: UsersService
    ) {}

    ngOnInit(): void {
        this.loadData();
    }

    async loadData(): Promise<void> {
        this.loading = true;
        try {
            const [intResp, usersResp, propsResp] = await Promise.all([
                this.integrationsService.getAll(),
                this.usersService.getAll(),
                this.integrationsService.getIntegrationProperties(),
            ]);
            this.integrations = this.extractArray(intResp);
            this.users = this.extractArray(usersResp);
            this.properties = this.extractArray(propsResp);
        } catch (err) {
            console.error('LoadData error:', err);
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

    // ── Filtre ──
    get filteredProperties(): IntegrationProperty[] {
        let result = this.properties;
        if (this.filterIntegrationId) {
            result = result.filter(p => p.integrationId === this.filterIntegrationId);
        }
        if (this.filterUserId) {
            result = result.filter(p => p.userId === this.filterUserId);
        }
        return result;
    }

    // ── Yardımcılar ──
    getIntegrationName(integrationId: string): string {
        return this.integrations.find(i => i.id === integrationId)?.integrationDescription ?? '-';
    }

    getUserName(userId: string): string {
        const u = this.users.find(u => u.id === userId);
        return u ? `${u.name} ${u.lastName}` : '-';
    }

    // ── Modal ──
    openCreate(): void {
        this.editMode = false;
        this.selectedProperty = null;
        this.form = { integrationId: '', userId: '', key: '', value: '' };
        this.showModal = true;
    }

    openEdit(prop: IntegrationProperty): void {
        this.editMode = true;
        this.selectedProperty = prop;
        this.form = {
            integrationId: prop.integrationId,
            userId: prop.userId,
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
                await this.integrationsService.updateIntegrationProperty(this.selectedProperty.id, {
                    integrationId: this.form.integrationId,
                    userId: this.form.userId,
                    key: this.form.key,
                    value: this.form.value,
                    isBlocked: this.selectedProperty.isBlocked ?? false,
                });
            } else {
                await this.integrationsService.createIntegrationProperty({
                    integrationId: this.form.integrationId,
                    userId: this.form.userId,
                    key: this.form.key,
                    value: this.form.value,
                });
            }
            this.showModal = false;
            await this.refreshProperties();
        } catch (err) {
            console.error('Save error:', err);
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
            await this.integrationsService.updateIntegrationProperty(prop.id, {
                integrationId: prop.integrationId,
                userId: prop.userId,
                key: prop.key,
                value: prop.value,
                isBlocked: !prop.isBlocked,
            });
            await this.refreshProperties();
        } catch (err) {
            console.error('Toggle error:', err);
        }
    }

    private async refreshProperties(): Promise<void> {
        try {
            const resp = await this.integrationsService.getIntegrationProperties();
            this.properties = this.extractArray(resp);
        } catch (err) {
            console.error('Refresh error:', err);
        }
    }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IntegrationsService } from '@/app/core/services/integrations.service';
import { UsersService } from '@/app/core/services/users.service';
import { Integration } from '@/app/core/models/integration/integration.models';
import { User } from '@/app/core/models/user/user.models';
import { IntegrationUser } from '@/app/core/models/integration/integration-user.models';

@Component({
    selector: 'app-user-integrations-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-integrations.html',
})
export class UserIntegrationsPage implements OnInit {
    users: User[] = [];
    integrations: Integration[] = [];
    integrationUsers: IntegrationUser[] = [];
    loading = false;

    // Filtre
    filterIntegrationId: string = '';

    // Atama modalı
    showAssignModal = false;
    selectedUser: User | null = null;
    selectedUserIntegrations: IntegrationUser[] = [];
    selectedIntegrationId: string = '';

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
            const usersResp = await this.usersService.getAll();
            this.users = this.extractArray(usersResp);

            const intResp = await this.integrationsService.getAll();
            this.integrations = this.extractArray(intResp);

            const iuResp = await this.integrationsService.getIntegrationUsers();
            this.integrationUsers = this.extractArray(iuResp);
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
    get filteredUsers(): User[] {
        if (!this.filterIntegrationId) return this.users;
        const assignedUserIds = this.integrationUsers
            .filter(iu => iu.integrationId === this.filterIntegrationId)
            .map(iu => iu.userId);
        return this.users.filter(u => assignedUserIds.includes(u.id));
    }

    // ── Yardımcılar ──
    getUserIntegrations(userId: string): IntegrationUser[] {
        return this.integrationUsers.filter(iu => iu.userId === userId);
    }

    getIntegrationName(integrationId: string): string {
        return this.integrations.find(i => i.id === integrationId)?.integrationDescription ?? '-';
    }

    getAvailableIntegrations(userId: string): Integration[] {
        const assignedIds = this.getUserIntegrations(userId).map(iu => iu.integrationId);
        return this.integrations.filter(i => !assignedIds.includes(i.id));
    }

    // ── Modal ──
    openAssignModal(user: User): void {
        this.selectedUser = user;
        this.selectedUserIntegrations = this.getUserIntegrations(user.id);
        this.selectedIntegrationId = '';
        this.showAssignModal = true;
    }

    closeModal(): void {
        this.showAssignModal = false;
        this.selectedUser = null;
    }

    // ── İşlemler ──
    async assignIntegration(): Promise<void> {
        if (!this.selectedUser || !this.selectedIntegrationId) return;
        try {
            await this.integrationsService.createIntegrationUser({
                integrationId: this.selectedIntegrationId,
                userId: this.selectedUser.id,
            });
            this.selectedIntegrationId = '';
            await this.refreshIntegrationUsers();
        } catch (err) {
            console.error('Atama hatası:', err);
        }
    }

    async removeIntegration(iu: IntegrationUser): Promise<void> {
        if (confirm('Bu entegrasyon atamasını kaldırmak istediğinize emin misiniz?')) {
            try {
                await this.integrationsService.deleteIntegrationUser(iu.id);
                await this.refreshIntegrationUsers();
            } catch (err) {
                console.error('Silme hatası:', err);
            }
        }
    }

    async toggleBlock(iu: IntegrationUser): Promise<void> {
        try {
            await this.integrationsService.updateIntegrationUser(iu.id, {
                integrationId: iu.integrationId,
                userId: iu.userId,
                isBlocked: !iu.isBlocked,
            });
            await this.refreshIntegrationUsers();
        } catch (err) {
            console.error('Güncelleme hatası:', err);
        }
    }

    private async refreshIntegrationUsers(): Promise<void> {
        try {
            const resp = await this.integrationsService.getIntegrationUsers();
            this.integrationUsers = this.extractArray(resp);
            if (this.selectedUser) {
                this.selectedUserIntegrations = this.getUserIntegrations(this.selectedUser.id);
            }
        } catch (err) {
            console.error('Yenileme hatası:', err);
        }
    }
}

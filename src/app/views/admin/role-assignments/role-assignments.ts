import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { RolesService } from '@/app/core/services/roles.service';
import { UsersService } from '@/app/core/services/users.service';
import { User } from '@/app/core/models/user/user.models';
import { Role } from '@/app/core/models/role/role.models';
import { RoleUser } from '@/app/core/models/role/role.models';

@Component({
    selector: 'app-role-assignments-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './role-assignments.html',
})
export class RoleAssignmentsPage implements OnInit {
    users: User[] = [];
    roles: Role[] = [];
    roleUsers: RoleUser[] = [];
    loading = false;

    // Atama modalı
    showAssignModal = false;
    selectedUser: User | null = null;
    selectedUserRoles: RoleUser[] = [];
    selectedRoleId: string = '';

    constructor(
        private rolesService: RolesService,
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

            const rolesResp = await this.rolesService.getAll();
            this.roles = this.extractArray(rolesResp);

            const ruResp = await this.rolesService.getRoleUsers();
            this.roleUsers = this.extractArray(ruResp);
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

    getUserRoles(userId: string): RoleUser[] {
        return this.roleUsers.filter(ru => ru.userId === userId);
    }

    getRoleName(roleId: string): string {
        return this.roles.find(r => r.id === roleId)?.roleDescription ?? '-';
    }

    getAvailableRoles(userId: string): Role[] {
        const assignedRoleIds = this.getUserRoles(userId).map(ru => ru.roleId);
        return this.roles.filter(r => !assignedRoleIds.includes(r.id));
    }

    openAssignModal(user: User): void {
        this.selectedUser = user;
        this.selectedUserRoles = this.getUserRoles(user.id);
        this.selectedRoleId = '';
        this.showAssignModal = true;
    }

    async assignRole(): Promise<void> {
        if (!this.selectedUser || !this.selectedRoleId) return;
        try {
            await this.rolesService.assignRole({
                roleId: this.selectedRoleId,
                userId: this.selectedUser.id,
            });
            this.selectedRoleId = '';
            await this.refreshRoleUsers();
        } catch (err) {
            console.error('Assign error:', err);
        }
    }

    async removeRole(roleUser: RoleUser): Promise<void> {
        if (confirm(`Bu rolü kaldırmak istediğinize emin misiniz?`)) {
            try {
                await this.rolesService.removeRoleUser(roleUser.id);
                await this.refreshRoleUsers();
            } catch (err) {
                console.error('Remove error:', err);
            }
        }
    }

    private async refreshRoleUsers(): Promise<void> {
        try {
            const resp = await this.rolesService.getRoleUsers();
            this.roleUsers = this.extractArray(resp);
            if (this.selectedUser) {
                this.selectedUserRoles = this.getUserRoles(this.selectedUser.id);
            }
        } catch (err) {
            console.error('Refresh error:', err);
        }
    }

    closeModal(): void {
        this.showAssignModal = false;
        this.selectedUser = null;
    }
}

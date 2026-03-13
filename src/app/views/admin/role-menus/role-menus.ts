import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageTitle } from '@app/components/page-title';
import { MenusService } from '@/app/core/services/menus.service';
import { RolesService } from '@/app/core/services/roles.service';
import { Role } from '@/app/core/models/role/role.models';
import { Menu, RoleMenu, CreateRoleMenuRequest, UpdateRoleMenuRequest } from '@/app/core/models/menu/menu.models';

@Component({
    selector: 'app-role-menus-page',
    imports: [CommonModule, FormsModule, PageTitle],
    templateUrl: './role-menus.html',
})
export class RoleMenusPage implements OnInit {
    roles: Role[] = [];
    menus: Menu[] = [];
    loading = false;

    selectedRoleId: string = '';
    roleMenus: RoleMenu[] = [];
    loadingMenus = false;

    // Atama modalı
    showAssignModal = false;
    assignMenuId: string = '';
    assignForm: any = { canView: true, canCreate: false, canUpdate: false, canDelete: false };

    // Düzenleme modalı
    showEditModal = false;
    editingRoleMenu: RoleMenu | null = null;
    editForm: any = { canView: true, canCreate: false, canUpdate: false, canDelete: false, isBlocked: false };

    constructor(
        private menusService: MenusService,
        private rolesService: RolesService,
    ) {}

    ngOnInit(): void {
        this.loadInitialData();
    }

    async loadInitialData(): Promise<void> {
        this.loading = true;
        try {
            const rolesResp = await this.rolesService.getAll();
            this.roles = this.extractArray(rolesResp);

            const menusResp = await this.menusService.getAll();
            this.menus = this.extractArray(menusResp);
        } catch (err) {
            console.error('LoadInitialData error:', err);
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

    onRoleChange(): void {
        if (!this.selectedRoleId) {
            this.roleMenus = [];
            return;
        }
        this.loadRoleMenus();
    }

    async loadRoleMenus(): Promise<void> {
        this.loadingMenus = true;
        try {
            const resp = await this.menusService.getMenusByRole(this.selectedRoleId);
            this.roleMenus = this.extractArray(resp);
        } catch (err) {
            console.error('LoadRoleMenus error:', err);
        } finally {
            this.loadingMenus = false;
        }
    }

    getMenuName(menuId: string): string {
        return this.menus.find(m => m.id === menuId)?.name ?? '-';
    }

    getAvailableMenus(): Menu[] {
        const assignedMenuIds = this.roleMenus.map(rm => rm.menuId);
        return this.menus.filter(m => !assignedMenuIds.includes(m.id));
    }

    // Yeni menü atama
    openAssignModal(): void {
        this.assignMenuId = '';
        this.assignForm = { canView: true, canCreate: false, canUpdate: false, canDelete: false };
        this.showAssignModal = true;
    }

    async assignMenu(): Promise<void> {
        if (!this.selectedRoleId || !this.assignMenuId) return;
        try {
            const req: CreateRoleMenuRequest = {
                roleId: this.selectedRoleId,
                menuId: this.assignMenuId,
                canView: this.assignForm.canView,
                canCreate: this.assignForm.canCreate,
                canUpdate: this.assignForm.canUpdate,
                canDelete: this.assignForm.canDelete,
            };
            await this.menusService.assignMenu(req);
            this.showAssignModal = false;
            await this.loadRoleMenus();
        } catch (err) {
            console.error('Assign error:', err);
        }
    }

    // İzinleri düzenle
    openEditModal(rm: RoleMenu): void {
        this.editingRoleMenu = rm;
        this.editForm = {
            canView: rm.canView,
            canCreate: rm.canCreate,
            canUpdate: rm.canUpdate,
            canDelete: rm.canDelete,
            isBlocked: rm.isBlocked,
        };
        this.showEditModal = true;
    }

    async saveEdit(): Promise<void> {
        if (!this.editingRoleMenu) return;
        try {
            const req: UpdateRoleMenuRequest = {
                canView: this.editForm.canView,
                canCreate: this.editForm.canCreate,
                canUpdate: this.editForm.canUpdate,
                canDelete: this.editForm.canDelete,
                isBlocked: this.editForm.isBlocked,
            };
            await this.menusService.updateRoleMenu(this.editingRoleMenu.id, req);
            this.showEditModal = false;
            await this.loadRoleMenus();
        } catch (err) {
            console.error('SaveEdit error:', err);
        }
    }

    // Menü kaldır
    async removeMenu(rm: RoleMenu): Promise<void> {
        if (confirm(`"${this.getMenuName(rm.menuId)}" menüsünü bu rolden kaldırmak istediğinize emin misiniz?`)) {
            try {
                await this.menusService.removeRoleMenu(rm.id);
                await this.loadRoleMenus();
            } catch (err) {
                console.error('Remove error:', err);
            }
        }
    }

    closeAssignModal(): void {
        this.showAssignModal = false;
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingRoleMenu = null;
    }
}

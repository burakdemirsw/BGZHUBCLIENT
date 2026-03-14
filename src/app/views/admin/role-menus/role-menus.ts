import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenusService } from '@/app/core/services/menus.service';
import { RolesService } from '@/app/core/services/roles.service';
import { Role } from '@/app/core/models/role/role.models';
import { Menu, RoleMenu, CreateRoleMenuRequest, UpdateRoleMenuRequest } from '@/app/core/models/menu/menu.models';

@Component({
    selector: 'app-role-menus-page',
    imports: [CommonModule, FormsModule],
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
    assignMenuIds: string[] = [];
    // Düzenleme modalı
    showEditModal = false;
    editingRoleMenu: RoleMenu | null = null;
    editForm: any = { isBlocked: false };

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
        this.assignMenuIds = [];
        this.showAssignModal = true;
    }

    toggleMenuSelection(menuId: string): void {
        const idx = this.assignMenuIds.indexOf(menuId);
        if (idx > -1) {
            this.assignMenuIds.splice(idx, 1);
        } else {
            this.assignMenuIds.push(menuId);
        }
    }

    isMenuSelected(menuId: string): boolean {
        return this.assignMenuIds.includes(menuId);
    }

    selectAllMenus(): void {
        const available = this.getAvailableMenus();
        if (this.assignMenuIds.length === available.length) {
            this.assignMenuIds = [];
        } else {
            this.assignMenuIds = available.map(m => m.id);
        }
    }

    async assignMenus(): Promise<void> {
        if (!this.selectedRoleId || this.assignMenuIds.length === 0) return;
        try {
            for (const menuId of this.assignMenuIds) {
                const req: CreateRoleMenuRequest = {
                    roleId: this.selectedRoleId,
                    menuId: menuId,
                };
                await this.menusService.assignMenu(req);
            }
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
            isBlocked: rm.isBlocked,
        };
        this.showEditModal = true;
    }

    async saveEdit(): Promise<void> {
        if (!this.editingRoleMenu) return;
        try {
            const req: UpdateRoleMenuRequest = {
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

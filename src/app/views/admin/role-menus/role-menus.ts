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

    loadInitialData(): void {
        this.loading = true;
        this.rolesService.getAll().subscribe({
            next: (resp: any) => {
                this.roles = this.extractArray(resp);
                this.menusService.getAll().subscribe({
                    next: (mResp: any) => {
                        this.menus = this.extractArray(mResp);
                        this.loading = false;
                    },
                    error: () => this.loading = false,
                });
            },
            error: () => this.loading = false,
        });
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

    loadRoleMenus(): void {
        this.loadingMenus = true;
        this.menusService.getMenusByRole(this.selectedRoleId).subscribe({
            next: (resp: any) => {
                this.roleMenus = this.extractArray(resp);
                this.loadingMenus = false;
            },
            error: () => this.loadingMenus = false,
        });
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

    assignMenu(): void {
        if (!this.selectedRoleId || !this.assignMenuId) return;
        const req: CreateRoleMenuRequest = {
            roleId: this.selectedRoleId,
            menuId: this.assignMenuId,
            canView: this.assignForm.canView,
            canCreate: this.assignForm.canCreate,
            canUpdate: this.assignForm.canUpdate,
            canDelete: this.assignForm.canDelete,
        };
        this.menusService.assignMenu(req).subscribe({
            next: () => {
                this.showAssignModal = false;
                this.loadRoleMenus();
            },
        });
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

    saveEdit(): void {
        if (!this.editingRoleMenu) return;
        const req: UpdateRoleMenuRequest = {
            canView: this.editForm.canView,
            canCreate: this.editForm.canCreate,
            canUpdate: this.editForm.canUpdate,
            canDelete: this.editForm.canDelete,
            isBlocked: this.editForm.isBlocked,
        };
        this.menusService.updateRoleMenu(this.editingRoleMenu.id, req).subscribe({
            next: () => {
                this.showEditModal = false;
                this.loadRoleMenus();
            },
        });
    }

    // Menü kaldır
    removeMenu(rm: RoleMenu): void {
        if (confirm(`"${this.getMenuName(rm.menuId)}" menüsünü bu rolden kaldırmak istediğinize emin misiniz?`)) {
            this.menusService.removeRoleMenu(rm.id).subscribe({
                next: () => this.loadRoleMenus(),
            });
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

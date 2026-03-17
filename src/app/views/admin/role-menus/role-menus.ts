import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenusService } from '@/app/core/services/menus.service';
import { RolesService } from '@/app/core/services/roles.service';
import { Role } from '@/app/core/models/role/role.models';
import { Menu, RoleMenu, CreateRoleMenuRequest, UpdateRoleMenuRequest } from '@/app/core/models/menu/menu.models';

export interface MenuTreeNode {
    menu: Menu;
    children: MenuTreeNode[];
    expanded: boolean;
    assigned: boolean;
    roleMenu?: RoleMenu;
}  

@Component({
    selector: 'app-role-menus-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './role-menus.html',
})
export class RoleMenusPage implements OnInit {
    roles: Role[] = [];
    menus: Menu[] = [];
    loading = false;

    selectedRoleId = '';
    roleMenus: RoleMenu[] = [];
    loadingMenus = false;

    // Full tree (tüm menüler, assigned bilgisi ile)
    fullTree: MenuTreeNode[] = [];
    selectedNode: MenuTreeNode | null = null;
    treeFilterText = '';
    assigning = false;

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
            const [rolesResp, menusResp] = await Promise.all([
                this.rolesService.getAll(),
                this.menusService.getAll(),
            ]);
            this.roles = this.extractArray(rolesResp);
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

    // ── Tree builder ──
    private buildFullTree(): void {
        const roleMenuMap = new Map<string, RoleMenu>();
        for (const rm of this.roleMenus) roleMenuMap.set(rm.menuId, rm);

        // Filtrele
        let menuList = this.menus;
        if (this.treeFilterText) {
            const q = this.treeFilterText.toLowerCase();
            const matchedIds = new Set<string>();
            for (const m of this.menus) {
                if ((m.name || '').toLowerCase().includes(q) || (m.url || '').toLowerCase().includes(q)) {
                    // Eşleşen menünün kendisi ve tüm parent zinciri
                    let current: Menu | undefined = m;
                    while (current) {
                        matchedIds.add(current.id);
                        current = current.parentId ? this.menus.find(x => x.id === current!.parentId) : undefined;
                    }
                }
            }
            menuList = this.menus.filter(m => matchedIds.has(m.id));
        }

        const map = new Map<string | null, Menu[]>();
        for (const m of menuList) {
            const pid = m.parentId || null;
            if (!map.has(pid)) map.set(pid, []);
            map.get(pid)!.push(m);
        }

        const build = (parentId: string | null): MenuTreeNode[] => {
            const children = map.get(parentId) || [];
            return children
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map(m => ({
                    menu: m,
                    children: build(m.id),
                    expanded: !!this.treeFilterText, // filtre varsa açık, yoksa kapalı
                    assigned: roleMenuMap.has(m.id),
                    roleMenu: roleMenuMap.get(m.id),
                }));
        };
        this.fullTree = build(null);
    }

    // ── Role ──
    onRoleChange(): void {
        this.selectedNode = null;
        this.treeFilterText = '';
        if (!this.selectedRoleId) {
            this.roleMenus = [];
            this.fullTree = [];
            return;
        }
        this.loadRoleMenus();
    }

    async loadRoleMenus(): Promise<void> {
        this.loadingMenus = true;
        try {
            const resp = await this.menusService.getMenusByRole(this.selectedRoleId);
            this.roleMenus = this.extractArray(resp);
            this.buildFullTree();
        } catch (err) {
            console.error('LoadRoleMenus error:', err);
        } finally {
            this.loadingMenus = false;
        }
    }

    onTreeFilterChange(): void {
        this.buildFullTree();
    }

    getMenuName(menuId: string): string {
        return this.menus.find(m => m.id === menuId)?.name ?? '-';
    }

    getParentName(parentId: string | null): string {
        if (!parentId) return 'Kök (Ana Menü)';
        return this.menus.find(m => m.id === parentId)?.name ?? '-';
    }

    // ── Tree actions ──
    toggleNode(node: MenuTreeNode, event: Event): void {
        event.stopPropagation();
        node.expanded = !node.expanded;
    }

    selectNode(node: MenuTreeNode): void {
        this.selectedNode = node;
    }

    expandAll(): void {
        this.setExpanded(this.fullTree, true);
    }

    collapseAll(): void {
        this.setExpanded(this.fullTree, false);
    }

    private setExpanded(nodes: MenuTreeNode[], val: boolean): void {
        for (const n of nodes) {
            n.expanded = val;
            this.setExpanded(n.children, val);
        }
    }

    // ── Checkbox toggle: assign/unassign ──
    async toggleAssign(node: MenuTreeNode, event: Event): Promise<void> {
        event.stopPropagation();
        if (this.assigning) return;
        this.assigning = true;
        try {
            if (node.assigned && node.roleMenu) {
                // Kaldır
                await this.menusService.removeRoleMenu(node.roleMenu.id);
                if (this.selectedNode?.menu.id === node.menu.id) this.selectedNode = null;
            } else {
                // Ata
                const req: CreateRoleMenuRequest = { roleId: this.selectedRoleId, menuId: node.menu.id };
                await this.menusService.assignMenu(req);
            }
            await this.loadRoleMenus();
            // Seçili node'u güncelle
            if (this.selectedNode) {
                this.selectedNode = this.findNode(this.fullTree, this.selectedNode.menu.id) || null;
            }
        } catch (err) {
            console.error('Toggle assign error:', err);
        } finally {
            this.assigning = false;
        }
    }

    private findNode(nodes: MenuTreeNode[], menuId: string): MenuTreeNode | undefined {
        for (const n of nodes) {
            if (n.menu.id === menuId) return n;
            const found = this.findNode(n.children, menuId);
            if (found) return found;
        }
        return undefined;
    }

    getAssignedCount(): number {
        return this.roleMenus.length;
    }

    // ── Edit modal ──
    openEditModal(rm: RoleMenu): void {
        this.editingRoleMenu = rm;
        this.editForm = { isBlocked: rm.isBlocked };
        this.showEditModal = true;
    }

    async saveEdit(): Promise<void> {
        if (!this.editingRoleMenu) return;
        try {
            const req: UpdateRoleMenuRequest = { isBlocked: this.editForm.isBlocked };
            await this.menusService.updateRoleMenu(this.editingRoleMenu.id, req);
            this.showEditModal = false;
            await this.loadRoleMenus();
            if (this.selectedNode) {
                this.selectedNode = this.findNode(this.fullTree, this.selectedNode.menu.id) || null;
            }
        } catch (err) {
            console.error('SaveEdit error:', err);
        }
    }

    // ── Remove from preview ──
    async removeMenu(rm: RoleMenu): Promise<void> {
        if (confirm(`"${this.getMenuName(rm.menuId)}" menüsünü bu rolden kaldırmak istediğinize emin misiniz?`)) {
            try {
                await this.menusService.removeRoleMenu(rm.id);
                if (this.selectedNode?.roleMenu?.id === rm.id) this.selectedNode = null;
                await this.loadRoleMenus();
            } catch (err) {
                console.error('Remove error:', err);
            }
        }
    }

    closeEditModal(): void {
        this.showEditModal = false;
        this.editingRoleMenu = null;
    }
}

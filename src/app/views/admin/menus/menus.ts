import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenusService } from '@/app/core/services/menus.service';
import { Menu, CreateMenuRequest, UpdateMenuRequest } from '@/app/core/models/menu/menu.models';
import { FA_ICONS } from '@/app/constants/fa-icons';
import { UserMenuService } from '@/app/core/services/user-menu.service';

const LAST_PARENT_KEY = 'admin.menus.lastParentId';

@Component({
    selector: 'app-menus-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './menus.html',
    styleUrls: ['./menus.scss'],
})
export class MenusPage implements OnInit {
    menus: Menu[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedMenu: Menu | null = null;
    /** Son eklenen menünün üst menüsü; yeni kayıtta varsayılan olarak seçilir */
    private lastParentId: string | null = this.readLastParentId();

    // Datatable filter & pagination
    filterText: string = '';
    filteredMenus: Menu[] = [];
    pagedMenus: Menu[] = [];
    currentPage: number = 1;
    pageSize: number = 10;
    totalPages: number = 1;
    totalPagesArray: number[] = [];

    form: any = {
        parentId: null,
        name: '',
        description: '',
        url: '',
        icon: '',
        colorCode: '',
        orderIndex: 0,
        isBlocked: false,
        isInvisible: false,
        isTitle: false,
    };

    // İkon seçici
    allIcons = FA_ICONS;
    iconSearchText = '';
    filteredIcons = FA_ICONS;
    showIconDropdown = false;

    // Üst menü seçici
    parentSearchText = '';
    showParentDropdown = false;

    constructor(
        private menusService: MenusService,
        private userMenuService: UserMenuService
    ) {}

    ngOnInit(): void {
        this.loadMenus();
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
        // Filter
        const filter = (this.filterText || '').toLowerCase();
        this.filteredMenus = this.menus.filter(menu =>
            menu.name.toLowerCase().includes(filter) ||
            (menu.description || '').toLowerCase().includes(filter) ||
            (menu.icon || '').toLowerCase().includes(filter) ||
            (menu.url || '').toLowerCase().includes(filter)
        );
        // Pagination
        this.totalPages = Math.max(1, Math.ceil(this.filteredMenus.length / this.pageSize));
        this.totalPagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.pagedMenus = this.filteredMenus.slice(start, end);
    }

    async loadMenus(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.menusService.getAll();
            //console.log('Menus response:', response);
            this.menus = this.extractArray(response);
            this.applyFilterAndPaging();
        } catch (err) {
            console.error('Menus error:', err);
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
        this.selectedMenu = null;
        // Son kullanılan üst menü hâlâ mevcutsa hatırlanır
        const parentId = this.lastParentId && this.menus.some((m) => m.id === this.lastParentId) ? this.lastParentId : null;
        this.form = { parentId, name: '', description: '', url: '', icon: '', colorCode: '', orderIndex: 0, isBlocked: false, isInvisible: false, isTitle: false };
        this.resetParentPicker();
        this.showModal = true;
    }

    /** Satırı kopyalar: yeni kayıt formu seçili menünün değerleriyle açılır, kaydetmeden önce düzenlenebilir. */
    openCopy(menu: Menu): void {
        this.editMode = false;
        this.selectedMenu = null;
        this.form = {
            parentId: menu.parentId,
            name: `${menu.name} (Kopya)`,
            description: menu.description,
            url: menu.url,
            icon: menu.icon,
            colorCode: menu.colorCode || '',
            orderIndex: (Number(menu.orderIndex) || 0) + 1,
            isBlocked: false,
            isInvisible: menu.isInvisible ?? false,
            isTitle: menu.isTitle ?? false,
        };
        this.resetParentPicker();
        this.showModal = true;
    }

    openEdit(menu: Menu): void {
        this.editMode = true;
        this.selectedMenu = menu;
        this.form = {
            parentId: menu.parentId,
            name: menu.name,
            description: menu.description,
            url: menu.url,
            icon: menu.icon,
            colorCode: menu.colorCode || '',
            orderIndex: menu.orderIndex,
            isBlocked: menu.isBlocked,
            isInvisible: menu.isInvisible ?? false,
            isTitle: menu.isTitle ?? false,
        };
        this.resetParentPicker();
        this.showModal = true;
    }

    async save(): Promise<void> {
        try {
            if (this.editMode && this.selectedMenu) {
                const req: UpdateMenuRequest = {
                    parentId: this.form.parentId,
                    name: this.form.name,
                    description: this.form.description,
                    url: this.form.url,
                    icon: this.form.icon,
                    colorCode: this.form.colorCode,
                    orderIndex: this.form.orderIndex,
                    isBlocked: this.form.isBlocked,
                    isInvisible: this.form.isInvisible,
                    isTitle: this.form.isTitle,
                };
                await this.menusService.update(this.selectedMenu.id, req);
            } else {
                const req: CreateMenuRequest = {
                    parentId: this.form.parentId,
                    name: this.form.name,
                    description: this.form.description,
                    url: this.form.url,
                    icon: this.form.icon,
                    colorCode: this.form.colorCode,
                    orderIndex: this.form.orderIndex,
                    isInvisible: this.form.isInvisible,
                    isTitle: this.form.isTitle,
                };
                await this.menusService.create(req);
                this.rememberLastParentId(req.parentId);
            }
            this.showModal = false;
            await this.loadMenus();
            await this.userMenuService.loadUserMenus();
        } catch (err: any) {
            console.error('Save error:', err);
            // Backend CreatedAtAction route hatası — kayıt oluşmuş olabilir
            if (err?.status === 400 && JSON.stringify(err.error)?.includes('No route matches')) {
                if (!this.editMode) this.rememberLastParentId(this.form.parentId);
                this.showModal = false;
                await this.loadMenus();
                await this.userMenuService.loadUserMenus();
                return;
            }
            const validationErrors = err?.error?.errors
                ? Object.values(err.error.errors as Record<string, string[]>).flat().join('\n')
                : '';
            const msg = err?.status === 0
                ? `Sunucuya bağlanılamadı.\nURL: ${err.url}`
                : `Hata ${err?.status}: ${validationErrors || err?.error?.message || err?.error?.title || JSON.stringify(err?.error)}`;
            alert('Menü kaydedilemedi:\n' + msg);
        }
    }

    async deleteMenu(menu: Menu): Promise<void> {
        if (confirm(`"${menu.name}" menüsünü silmek istediğinize emin misiniz?`)) {
            try {
                await this.menusService.delete(menu.id);
                await this.loadMenus();
                await this.userMenuService.loadUserMenus();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    private rememberLastParentId(parentId: string | null): void {
        this.lastParentId = parentId;
        try {
            if (parentId) localStorage.setItem(LAST_PARENT_KEY, parentId);
            else localStorage.removeItem(LAST_PARENT_KEY);
        } catch {
            // localStorage kullanılamıyorsa yalnızca bu oturumda hatırlanır
        }
    }

    private readLastParentId(): string | null {
        try {
            return localStorage.getItem(LAST_PARENT_KEY);
        } catch {
            return null;
        }
    }

    getParentName(parentId: string | null): string {
        if (!parentId) return '—';
        const parent = this.menus.find((m) => m.id === parentId);
        return parent ? parent.name : '—';
    }

    // ── Üst Menü Seçici ──

    /** Aramaya uyan menüler; düzenlenen menü ve alt menüleri döngü oluşmaması için listelenmez. */
    get parentOptions(): Menu[] {
        const excluded = this.editMode && this.selectedMenu ? this.getDescendantIds(this.selectedMenu.id) : new Set<string>();
        const q = (this.parentSearchText || '').toLocaleLowerCase('tr-TR').trim();
        return this.menus
            .filter(m => !excluded.has(m.id))
            .filter(m => !q ||
                this.getMenuPath(m).toLocaleLowerCase('tr-TR').includes(q) ||
                (m.url || '').toLocaleLowerCase('tr-TR').includes(q))
            .sort((a, b) => this.getMenuPath(a).localeCompare(this.getMenuPath(b), 'tr-TR'));
    }

    /** "Üst › Alt › Menü" biçiminde tam yol */
    getMenuPath(menu: Menu): string {
        const names = [menu.name];
        const visited = new Set<string>([menu.id]);
        let parentId = menu.parentId;
        while (parentId && !visited.has(parentId)) {
            visited.add(parentId);
            const parent = this.menus.find(m => m.id === parentId);
            if (!parent) break;
            names.unshift(parent.name);
            parentId = parent.parentId;
        }
        return names.join(' › ');
    }

    getParentPath(parentId: string | null): string {
        const parent = parentId ? this.menus.find(m => m.id === parentId) : null;
        return parent ? this.getMenuPath(parent) : '— Ana Menü —';
    }

    selectParent(menu: Menu | null): void {
        this.form.parentId = menu?.id ?? null;
        this.parentSearchText = '';
        this.showParentDropdown = false;
    }

    toggleParentDropdown(): void {
        this.showParentDropdown = !this.showParentDropdown;
        if (this.showParentDropdown) this.parentSearchText = '';
    }

    private resetParentPicker(): void {
        this.parentSearchText = '';
        this.showParentDropdown = false;
    }

    private getDescendantIds(rootId: string): Set<string> {
        const ids = new Set<string>([rootId]);
        let added = true;
        while (added) {
            added = false;
            for (const m of this.menus) {
                if (m.parentId && ids.has(m.parentId) && !ids.has(m.id)) {
                    ids.add(m.id);
                    added = true;
                }
            }
        }
        return ids;
    }

    // ── İkon Seçici ──
    onIconSearch(): void {
        const q = (this.iconSearchText || '').toLowerCase();
        this.filteredIcons = this.allIcons.filter(
            i => i.label.toLowerCase().includes(q) || i.class.toLowerCase().includes(q)
        );
        this.showIconDropdown = true;
    }

    selectIcon(icon: { class: string; label: string }): void {
        this.form.icon = icon.class;
        this.iconSearchText = '';
        this.filteredIcons = this.allIcons;
        this.showIconDropdown = false;
    }

    clearIcon(): void {
        this.form.icon = '';
        this.iconSearchText = '';
        this.filteredIcons = this.allIcons;
    }

    toggleIconDropdown(): void {
        this.showIconDropdown = !this.showIconDropdown;
        if (this.showIconDropdown) {
            this.filteredIcons = this.allIcons;
            this.iconSearchText = '';
        }
    }

    closeModal(): void {
        this.showModal = false;
        this.showIconDropdown = false;
        this.showParentDropdown = false;
    }
}

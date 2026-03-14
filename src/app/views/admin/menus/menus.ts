import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenusService } from '@/app/core/services/menus.service';
import { Menu, CreateMenuRequest, UpdateMenuRequest } from '@/app/core/models/menu/menu.models';

@Component({
    selector: 'app-menus-page',
    imports: [CommonModule, FormsModule],
    templateUrl: './menus.html',
})
export class MenusPage implements OnInit {
    menus: Menu[] = [];
    loading = false;
    showModal = false;
    editMode = false;
    selectedMenu: Menu | null = null;

    form: any = {
        parentId: null,
        name: '',
        description: '',
        url: '',
        icon: '',
        orderIndex: 0,
        isBlocked: false,
    };

    constructor(private menusService: MenusService) {}

    ngOnInit(): void {
        this.loadMenus();
    }

    async loadMenus(): Promise<void> {
        this.loading = true;
        try {
            const response = await this.menusService.getAll();
            console.log('Menus response:', response);
            this.menus = this.extractArray(response);
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
        this.form = { parentId: null, name: '', description: '', url: '', icon: '', orderIndex: 0, isBlocked: false };
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
            orderIndex: menu.orderIndex,
            isBlocked: menu.isBlocked,
        };
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
                    orderIndex: this.form.orderIndex,
                    isBlocked: this.form.isBlocked,
                };
                await this.menusService.update(this.selectedMenu.id, req);
            } else {
                const req: CreateMenuRequest = {
                    parentId: this.form.parentId,
                    name: this.form.name,
                    description: this.form.description,
                    url: this.form.url,
                    icon: this.form.icon,
                    orderIndex: this.form.orderIndex,
                };
                await this.menusService.create(req);
            }
            this.showModal = false;
            await this.loadMenus();
        } catch (err) {
            console.error('Save error:', err);
        }
    }

    async deleteMenu(menu: Menu): Promise<void> {
        if (confirm(`"${menu.name}" menüsünü silmek istediğinize emin misiniz?`)) {
            try {
                await this.menusService.delete(menu.id);
                await this.loadMenus();
            } catch (err) {
                console.error('Delete error:', err);
            }
        }
    }

    getParentName(parentId: string | null): string {
        if (!parentId) return '—';
        const parent = this.menus.find((m) => m.id === parentId);
        return parent ? parent.name : '—';
    }

    closeModal(): void {
        this.showModal = false;
    }
}

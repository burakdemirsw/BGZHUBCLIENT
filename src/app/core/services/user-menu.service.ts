import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { MenusService } from './menus.service';
import { MenuItemType } from '@/app/types/layout';
import { Menu, RoleMenu } from '@/app/core/models/menu/menu.models';

@Injectable({
  providedIn: 'root',
})
export class UserMenuService {
  /** Dinamik kullanıcı menüleri */
  userMenuItems: MenuItemType[] = [];
  loaded = false;

  constructor(
    private menusService: MenusService,
    private jwtHelper: JwtHelperService,
  ) {}

  /** JWT token'dan userId çöz */
  getUserIdFromToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const decoded = this.jwtHelper.decodeToken(token);
      // .NET JWT claim isimleri
      return (
        decoded?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
        decoded?.['sub'] ??
        decoded?.['nameid'] ??
        decoded?.['userId'] ??
        decoded?.['Id'] ??
        null
      );
    } catch {
      return null;
    }
  }

  /** Kullanıcıya ait menüleri API'den yükle ve MenuItemType[] oluştur */
  async loadUserMenus(): Promise<void> {
    const userId = this.getUserIdFromToken();
    if (!userId) {
      this.userMenuItems = [];
      this.loaded = true;
      return;
    }

    try {
      // 1) Tüm menüleri al (id, parentId, name, url, icon, orderIndex)
      const allMenusResp = await this.menusService.getAll();
      const allMenus: Menu[] = this.extractArray(allMenusResp);

      // 2) Kullanıcının rollerine atanmış menüleri al
      const roleMenusResp = await this.menusService.getMenusByUser(userId);
      const roleMenus: RoleMenu[] = this.extractArray(roleMenusResp);

      // 3) Kullanıcıya atanmış menü ID'leri
      const allowedMenuIds = new Set(
        roleMenus
          .filter(rm => !rm.isBlocked)
          .map(rm => rm.menuId)
      );

      // 4) Filtrelenmiş menüleri al (engelli olmayanlar + kullanıcıya atanmış)
      const allowedMenus = allMenus.filter(m => !m.isBlocked && allowedMenuIds.has(m.id));

      // 5) Parent menülerini de ekle (eğer child'ı varsa parent'ı da göster)
      const finalMenuIds = new Set(allowedMenus.map(m => m.id));
      for (const menu of allowedMenus) {
        if (menu.parentId && !finalMenuIds.has(menu.parentId)) {
          const parent = allMenus.find(m => m.id === menu.parentId);
          if (parent && !parent.isBlocked) {
            finalMenuIds.add(parent.id);
          }
        }
      }

      const finalMenus = allMenus
        .filter(m => finalMenuIds.has(m.id))
        .sort((a, b) => a.orderIndex - b.orderIndex);

      // 6) Ağaç yapısına dönüştür
      this.userMenuItems = this.buildMenuTree(finalMenus);
      this.loaded = true;
    } catch (err) {
      console.error('UserMenuService loadUserMenus error:', err);
      this.userMenuItems = [];
      this.loaded = true;
    }
  }

  /** Düz menü listesinden ağaç yapısı oluştur */
  private buildMenuTree(menus: Menu[]): MenuItemType[] {
    const result: MenuItemType[] = [];
    const topLevel = menus.filter(m => !m.parentId);
    const childMap = new Map<string, Menu[]>();

    for (const m of menus) {
      if (m.parentId) {
        if (!childMap.has(m.parentId)) childMap.set(m.parentId, []);
        childMap.get(m.parentId)!.push(m);
      }
    }

    for (const parent of topLevel) {
      const children = childMap.get(parent.id);

      if (children && children.length > 0) {
        // Alt menüleri olan eleman → başlık + children
        // Eğer parent'ın URL'i yoksa → isTitle olarak ekle + collapse group
        if (!parent.url) {
          // Collapsible grup (başlık olarak parent adı zaten görünür)
          result.push({
            label: parent.name,
            faIcon: parent.icon || undefined,
            isCollapsed: true,
            children: children
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map(c => ({
                label: c.name,
                url: c.url || undefined,
                faIcon: c.icon || undefined,
              })),
          });
        } else {
          // URL'i olan parent → normal menu item with children
          result.push({
            label: parent.name,
            url: parent.url,
            faIcon: parent.icon || undefined,
            isCollapsed: true,
            children: children
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map(c => ({
                label: c.name,
                url: c.url || undefined,
                faIcon: c.icon || undefined,
              })),
          });
        }
      } else {
        // Alt menüsü yok → tek menu item (URL'i varsa göster)
        if (parent.url) {
          result.push({
            label: parent.name,
            url: parent.url,
            faIcon: parent.icon || undefined,
          });
        }
      }
    }

    return result;
  }

  /** Menüleri temizle */
  clearMenus(): void {
    this.userMenuItems = [];
    this.loaded = false;
  }

  private extractArray(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response?.$values) return response.$values;
    if (response?.data) return Array.isArray(response.data) ? response.data : [response.data];
    if (response?.items) return response.items;
    if (response?.result) return Array.isArray(response.result) ? response.result : [response.result];
    return [];
  }
}

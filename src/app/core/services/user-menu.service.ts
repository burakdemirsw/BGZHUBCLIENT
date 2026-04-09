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
      const allMenus: Menu[] = (allMenusResp.data as Menu[]) ?? [];

      // 2) Kullanıcının rollerine atanmış menüleri al
      const roleMenusResp = await this.menusService.getMenusByUser(userId);
      const roleMenus: RoleMenu[] = (roleMenusResp.data as RoleMenu[]) ?? [];

      // 3) Kullanıcıya atanmış menü ID'leri
      const allowedMenuIds = new Set(
        roleMenus
          .filter(rm => !rm.isBlocked)
          .map(rm => rm.menuId)
      );

      // 4) Filtrelenmiş menüleri al (engelli olmayanlar + görünür olanlar + kullanıcıya atanmış)
      const allowedMenus = allMenus.filter(m => !m.isBlocked && !m.isInvisible && allowedMenuIds.has(m.id));

      // 5) Parent menülerini de ekle (eğer child'ı varsa parent'ı da göster)
      const finalMenuIds = new Set(allowedMenus.map(m => m.id));
      for (const menu of allowedMenus) {
        if (menu.parentId && !finalMenuIds.has(menu.parentId)) {
          const parent = allMenus.find(m => m.id === menu.parentId);
          if (parent && !parent.isBlocked && !parent.isInvisible) {
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

  /** Düz menü listesinden ağaç yapısı oluştur (recursive) */
  private buildMenuTree(menus: Menu[]): MenuItemType[] {
    const childMap = new Map<string, Menu[]>();

    for (const m of menus) {
      if (m.parentId) {
        if (!childMap.has(m.parentId)) childMap.set(m.parentId, []);
        childMap.get(m.parentId)!.push(m);
      }
    }

    const topLevel = menus.filter(m => !m.parentId);
    return this.buildMenuLevel(topLevel, childMap);
  }

  /** Belirli seviyedeki menüleri recursive olarak oluştur */
  private buildMenuLevel(items: Menu[], childMap: Map<string, Menu[]>): MenuItemType[] {
    const result: MenuItemType[] = [];

    for (const item of items.sort((a, b) => a.orderIndex - b.orderIndex)) {
      const children = childMap.get(item.id);
      const hasChildren = children && children.length > 0;
      const hasUrl = !!item.url; // boş string "" → false

      // Ana başlık mı yoksa alt menü mü? parentId varsa alt menü öğesi
      const isChild = !!item.parentId;
      const defaultIcon = isChild ? 'fa fa-circle' : undefined;

      if (hasChildren) {
        // Alt menüleri olan eleman → collapsible grup
        const childItems = this.buildMenuLevel(children, childMap);
        result.push({
          label: item.name,
          url: hasUrl ? item.url : undefined,
          faIcon: item.icon || defaultIcon,
          isCollapsed: true,
          children: childItems,
        });
      } else {
        // Alt menüsü yok → tek menü öğesi (URL'i olmasa bile göster)
        result.push({
          label: item.name,
          url: hasUrl ? item.url : undefined,
          faIcon: item.icon || defaultIcon,
        });
      }
    }

    return result;
  }

  /** Menüleri temizle */
  clearMenus(): void {
    this.userMenuItems = [];
    this.loaded = false;
  }

}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateMenuRequest, UpdateMenuRequest } from '../models/menu/menu.models';
import { CreateRoleMenuRequest, UpdateRoleMenuRequest } from '../models/menu/menu.models';

@Injectable({
  providedIn: 'root',
})
export class MenusService {
  constructor(private http: HttpClientService) {}

  // Menus
  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Menus' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Menus' }, id);
  }

  create(request: CreateMenuRequest): Promise<any> {
    return this.http.post({ controller: 'Menus' }, request);
  }

  update(id: string, request: UpdateMenuRequest): Promise<any> {
    return this.http.post({ controller: 'Menus', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Menus', action: `delete/${id}` }, {});
  }

  // Role-Menus
  getRoleMenus(): Promise<any> {
    return this.http.get_new({ controller: 'RoleMenus' });
  }

  getMenusByRole(roleId: string): Promise<any> {
    return this.http.get_new({ controller: 'RoleMenus', action: 'by-role' }, roleId);
  }

  getMenusByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'RoleMenus', action: `by-user/${userId}` });
  }

  assignMenu(request: CreateRoleMenuRequest): Promise<any> {
    return this.http.post({ controller: 'RoleMenus' }, request);
  }

  updateRoleMenu(id: string, request: UpdateRoleMenuRequest): Promise<any> {
    return this.http.post({ controller: 'RoleMenus', action: `update/${id}` }, request);
  }

  removeRoleMenu(id: string): Promise<any> {
    return this.http.post({ controller: 'RoleMenus', action: `delete/${id}` }, {});
  }

  // Authorization
  isUserAuthorized(userId: string, url: string): Promise<any> {
    return this.http.get_new({
      controller: 'RoleMenus',
      action: `is-authorized/${userId}`,
      queryString: `url=${encodeURIComponent(url)}`
    });
  }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateMenuRequest, UpdateMenuRequest } from '../models/menu/menu.models';
import { CreateRoleMenuRequest, UpdateRoleMenuRequest } from '../models/menu/menu.models';

@Injectable({
  providedIn: 'root',
})
export class MenusService {
  constructor(private http: HttpClientService) {}

  // Menus
  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Menus' });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Menus' }, id);
  }

  create(request: CreateMenuRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Menus' }, request);
  }

  update(id: string, request: UpdateMenuRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Menus', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Menus', action: `delete/${id}` }, {});
  }

  // Role-Menus
  getRoleMenus(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'RoleMenus' });
  }

  getMenusByRole(roleId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'RoleMenus', action: 'by-role' }, roleId);
  }

  getMenusByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'RoleMenus', action: `by-user/${userId}` });
  }

  assignMenu(request: CreateRoleMenuRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'RoleMenus' }, request);
  }

  updateRoleMenu(id: string, request: UpdateRoleMenuRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'RoleMenus', action: `update/${id}` }, request);
  }

  removeRoleMenu(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'RoleMenus', action: `delete/${id}` }, {});
  }

  // Authorization
  async isUserAuthorized(userId: string, url: string): Promise<ApiResponse<any>> {
    return await this.http.get<any>({
      controller: 'RoleMenus',
      action: `is-authorized/${userId}`,
      queryString: `url=${encodeURIComponent(url)}`
    });
  }
}

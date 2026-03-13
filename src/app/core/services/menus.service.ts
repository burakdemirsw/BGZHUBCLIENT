import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Menu, CreateMenuRequest, UpdateMenuRequest } from '../models/menu/menu.models';
import { RoleMenu, CreateRoleMenuRequest, UpdateRoleMenuRequest } from '../models/menu/menu.models';

@Injectable({
  providedIn: 'root',
})
export class MenusService {
  constructor(private http: HttpClientService) {}

  // Menus
  getAll(): Observable<any> {
    return this.http.get_new({ controller: 'Menus' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Menus' }, id);
  }

  create(request: CreateMenuRequest): Observable<any> {
    return this.http.post({ controller: 'Menus' }, request);
  }

  update(id: string, request: UpdateMenuRequest): Observable<any> {
    return this.http.put({ controller: 'Menus', action: id }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.delete({ controller: 'Menus' }, id);
  }

  // Role-Menus
  getRoleMenus(): Observable<RoleMenu[]> {
    return this.http.get<RoleMenu>({ controller: 'RoleMenus' });
  }

  getMenusByRole(roleId: string): Observable<any> {
    return this.http.get_new({ controller: 'RoleMenus', action: 'by-role' }, roleId);
  }

  assignMenu(request: CreateRoleMenuRequest): Observable<any> {
    return this.http.post({ controller: 'RoleMenus' }, request);
  }

  updateRoleMenu(id: string, request: UpdateRoleMenuRequest): Observable<any> {
    return this.http.put({ controller: 'RoleMenus', action: id }, request);
  }

  removeRoleMenu(id: string): Observable<any> {
    return this.http.delete({ controller: 'RoleMenus' }, id);
  }
}

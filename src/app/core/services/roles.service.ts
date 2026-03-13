import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClientService } from './http-client.service';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../models/role/role.models';
import { RoleUser, CreateRoleUserRequest, UpdateRoleUserRequest } from '../models/role/role.models';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  constructor(private http: HttpClientService) {}

  // Roles
  getAll(): Observable<Role[]> {
    return this.http.get<Role>({ controller: 'Roles' });
  }

  getById(id: string): Observable<any> {
    return this.http.get_new({ controller: 'Roles' }, id);
  }

  create(request: CreateRoleRequest): Observable<any> {
    return this.http.post({ controller: 'Roles' }, request);
  }

  update(id: string, request: UpdateRoleRequest): Observable<any> {
    return this.http.put({ controller: 'Roles', action: id }, request);
  }

  delete(id: string): Observable<any> {
    return this.http.delete({ controller: 'Roles' }, id);
  }

  // Role-Users
  getRoleUsers(): Observable<RoleUser[]> {
    return this.http.get<RoleUser>({ controller: 'RoleUsers' });
  }

  getUsersByRole(roleId: string): Observable<any> {
    return this.http.get_new({ controller: 'RoleUsers', action: 'by-role' }, roleId);
  }

  getRolesByUser(userId: string): Observable<any> {
    return this.http.get_new({ controller: 'RoleUsers', action: 'by-user' }, userId);
  }

  assignRole(request: CreateRoleUserRequest): Observable<any> {
    return this.http.post({ controller: 'RoleUsers' }, request);
  }

  removeRoleUser(id: string): Observable<any> {
    return this.http.delete({ controller: 'RoleUsers' }, id);
  }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRoleRequest, UpdateRoleRequest } from '../models/role/role.models';
import { RoleUser, CreateRoleUserRequest, CreateBulkRoleUserRequest } from '../models/role/role.models';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  constructor(private http: HttpClientService) {}

  // Roles
  getAll(): Promise<any> {
    return this.http.get_new({ controller: 'Roles' });
  }

  getById(id: string): Promise<any> {
    return this.http.get_new({ controller: 'Roles' }, id);
  }

  create(request: CreateRoleRequest): Promise<any> {
    return this.http.post({ controller: 'Roles' }, request);
  }

  update(id: string, request: UpdateRoleRequest): Promise<any> {
    return this.http.post({ controller: 'Roles', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<any> {
    return this.http.post({ controller: 'Roles', action: `delete/${id}` }, {});
  }

  // Role-Users
  getRoleUsers(): Promise<any> {
    return this.http.get_new({ controller: 'RoleUsers' });
  }

  getUsersByRole(roleId: string): Promise<any> {
    return this.http.get_new({ controller: 'RoleUsers', action: 'by-role' }, roleId);
  }

  getRolesByUser(userId: string): Promise<any> {
    return this.http.get_new({ controller: 'RoleUsers', action: 'by-user' }, userId);
  }

  assignRole(request: CreateRoleUserRequest): Promise<any> {
    return this.http.post({ controller: 'RoleUsers' }, request);
  }

  bulkAssignRoles(request: CreateBulkRoleUserRequest): Promise<any> {
    return this.http.post({ controller: 'RoleUsers', action: 'bulk' }, request);
  }

  removeRoleUser(id: string): Promise<any> {
    return this.http.post({ controller: 'RoleUsers', action: `delete/${id}` }, {});
  }
}

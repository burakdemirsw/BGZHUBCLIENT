import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateRoleRequest, UpdateRoleRequest } from '../models/role/role.models';
import { RoleUser, CreateRoleUserRequest, CreateBulkRoleUserRequest } from '../models/role/role.models';

@Injectable({
  providedIn: 'root',
})
export class RolesService {
  constructor(private http: HttpClientService) {}

  // Roles
  getAll(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'Roles' });
  }

  getById(id: string): Promise<ApiResponse<any>> {
    return this.http.get<any>({ controller: 'Roles' }, id);
  }

  create(request: CreateRoleRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Roles' }, request);
  }

  update(id: string, request: UpdateRoleRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Roles', action: `update/${id}` }, request);
  }

  delete(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'Roles', action: `delete/${id}` }, {});
  }

  // Role-Users
  getRoleUsers(): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'RoleUsers' });
  }

  getUsersByRole(roleId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'RoleUsers', action: 'by-role' }, roleId);
  }

  getRolesByUser(userId: string): Promise<ApiResponse<any[]>> {
    return this.http.get<any[]>({ controller: 'RoleUsers', action: 'by-user' }, userId);
  }

  assignRole(request: CreateRoleUserRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'RoleUsers' }, request);
  }

  bulkAssignRoles(request: CreateBulkRoleUserRequest): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'RoleUsers', action: 'bulk' }, request);
  }

  removeRoleUser(id: string): Promise<ApiResponse<any>> {
    return this.http.post<any>({ controller: 'RoleUsers', action: `delete/${id}` }, {});
  }
}

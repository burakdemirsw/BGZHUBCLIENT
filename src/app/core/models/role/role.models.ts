export interface CreateRoleRequest {
  roleDescription: string;
}

export interface UpdateRoleRequest {
  roleDescription: string;
}

export interface Role {
  id: string;
  roleDescription: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateRoleUserRequest {
  roleId: string;
  userId: string;
}

export interface CreateBulkRoleUserRequest {
  roleUsers: CreateRoleUserRequest[];
}

export interface UpdateRoleUserRequest {
  roleId: string;
  userId: string;
}

export interface RoleUser {
  id: string;
  roleId: string;
  userId: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface RoleUserResponse {
  id: string;
  roleId: string;
  userId: string;
  roleDescription: string;
  createdDate: string;
  updatedDate: string;
}

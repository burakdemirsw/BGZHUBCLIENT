export interface CreateMenuRequest {
  parentId: string | null;
  name: string;
  description: string;
  url: string;
  icon: string;
  orderIndex: number;
}

export interface UpdateMenuRequest {
  parentId: string | null;
  name: string;
  description: string;
  url: string;
  icon: string;
  orderIndex: number;
  isBlocked: boolean;
}

export interface Menu {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  url: string;
  icon: string;
  orderIndex: number;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateRoleMenuRequest {
  roleId: string;
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface UpdateRoleMenuRequest {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isBlocked: boolean;
}

export interface RoleMenu {
  id: string;
  roleId: string;
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}

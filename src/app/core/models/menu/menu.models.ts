export interface CreateMenuRequest {
  parentId: string | null;
  name: string;
  description: string;
  url: string;
  icon: string;
  colorCode: string;
  orderIndex: number;
  isInvisible?: boolean;
  isTitle?: boolean;
}

export interface UpdateMenuRequest {
  parentId: string | null;
  name: string;
  description: string;
  url: string;
  icon: string;
  colorCode: string;
  orderIndex: number;
  isBlocked: boolean;
  isInvisible: boolean;
  isTitle: boolean;
}

export interface Menu {
  id: string;
  parentId: string | null;
  name: string;
  description: string;
  url: string;
  icon: string;
  colorCode: string;
  orderIndex: number;
  isBlocked: boolean;
  isInvisible: boolean;
  isTitle?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateRoleMenuRequest {
  roleId: string;
  menuId: string;
}

export interface UpdateRoleMenuRequest {
  isBlocked: boolean;
}

export interface RoleMenu {
  id: string;
  roleId: string;
  menuId: string;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}

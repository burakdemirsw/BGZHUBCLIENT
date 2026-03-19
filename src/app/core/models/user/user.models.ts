export interface CreateUserRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
  companyId?: string;
}

export interface UpdateUserRequest {
  name: string;
  lastName: string;
  email: string;
  gender: string;
  isBlocked: boolean;
  companyId?: string;
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  gender: string;
  isBlocked: boolean;
  companyId?: string;
  companyName?: string;
  createdDate?: string;
  updatedDate?: string;
}

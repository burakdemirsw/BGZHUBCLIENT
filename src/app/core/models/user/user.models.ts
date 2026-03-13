export interface CreateUserRequest {
  name: string;
  lastName: string;
  email: string;
  password: string;
  gender: string;
}

export interface UpdateUserRequest {
  name: string;
  lastName: string;
  email: string;
  gender: string;
  isBlocked: boolean;
}

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  gender: string;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}

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
  gender: string;
  isBlocked: boolean;
}

export interface UserResponse {
  id: string;
  name: string;
  lastName: string;
  email: string;
  gender: string;
  lastLoginDate?: string;
  isBlocked: boolean;
  createdDate?: string;
  updatedDate?: string;
}

/** @deprecated UserResponse kullanın */
export type User = UserResponse;

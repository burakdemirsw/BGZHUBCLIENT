export interface UserType {
  id: string;
  name?: string;
  code?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateUserTypeRequest {
  name: string;
  code: string;
}

export interface UpdateUserTypeRequest {
  name: string;
  code: string;
}

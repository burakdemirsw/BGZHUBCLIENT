export interface CustomerType {
  id: string;
  name?: string;
  description?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateCustomerTypeRequest {
  name: string;
  description: string;
}

export interface UpdateCustomerTypeRequest {
  name: string;
  description: string;
  isBlocked: boolean;
}

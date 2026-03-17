export interface CustomerContact {
  id: string;
  customerId?: string;
  contactTypeId?: string;
  value?: string;
  isDefault?: boolean;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  customerName?: string;
  contactTypeName?: string;
}

export interface CreateCustomerContactRequest {
  customerId: string;
  contactTypeId: string;
  value: string;
  isDefault: boolean;
}

export interface UpdateCustomerContactRequest {
  customerId: string;
  contactTypeId: string;
  value: string;
  isDefault: boolean;
  isBlocked: boolean;
}

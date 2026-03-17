export interface CustomerDescription {
  id: string;
  customerId?: string;
  langCode?: string;
  firstName?: string;
  lastName?: string;
  description?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  customerName?: string;
}

export interface CreateCustomerDescriptionRequest {
  customerId: string;
  langCode: string;
  firstName: string;
  lastName: string;
  description: string;
}

export interface UpdateCustomerDescriptionRequest {
  customerId: string;
  langCode: string;
  firstName: string;
  lastName: string;
  description: string;
}

export interface Customer {
  id: string;
  userId?: string;
  socialMediaAccountId?: string;
  platformAccountId?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  companyName?: string;
  customerCode?: string;
  status?: number;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  userName?: string;
  socialMediaAccountName?: string;
}

export interface CreateCustomerRequest {
  userId: string;
  socialMediaAccountId: string;
  platformAccountId: string;
}

export interface UpdateCustomerRequest {
  userId: string;
  socialMediaAccountId: string;
  platformAccountId: string;
  status: number;
  isBlocked: boolean;
}

// ── Customer Detail Response ──
export interface CustomerDetailResponse {
  id: string;
  userId: string;
  socialMediaAccountId: string;
  companyId: string;
  platformAccountId: string;
  platformUsername: string;
  platformName: string;
  status: number;
  isBlocked: boolean;
  createdDate: string;
  updatedDate: string;
  user?: UserSummary;
  socialMediaAccount?: SocialMediaAccountSummary;
  company?: CompanySummary;
  addresses: CustomerAddressSummary[];
  contacts: CustomerContactSummary[];
  descriptions: CustomerDescriptionSummary[];
}

export interface UserSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface SocialMediaAccountSummary {
  id: string;
  accountName?: string;
  platform?: string;
}

export interface CompanySummary {
  id: string;
  name?: string;
}

export interface CustomerAddressSummary {
  id: string;
  addressLine: string;
  postalCode?: string;
  isDefault: boolean;
  isBlocked: boolean;
}

export interface CustomerContactSummary {
  id: string;
  contactTypeId: string;
  value: string;
  isDefault: boolean;
  isBlocked: boolean;
}

export interface CustomerDescriptionSummary {
  id: string;
  langCode: string;
  firstName: string;
  lastName?: string;
  description?: string;
}

// ── Request Models ──
export interface CreateCustomerRequest {
  userId: string;
  socialMediaAccountId: string;
  companyId: string;
  platformAccountId: string;
  platformUsername?: string;
  platformName?: string;
}

export interface UpdateCustomerRequest {
  userId: string;
  socialMediaAccountId: string;
  companyId: string;
  platformAccountId: string;
  platformUsername?: string;
  platformName?: string;
  status: number;
  isBlocked: boolean;
}

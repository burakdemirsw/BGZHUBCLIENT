export interface CompanySetting {
  id: string;
  companyId: string;
  isTwoFactorAuthEnabled: boolean;
  isAutoReplyEnabled: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface CreateCompanySettingRequest {
  companyId: string;
  isTwoFactorAuthEnabled: boolean;
  isAutoReplyEnabled: boolean;
}

export interface UpdateCompanySettingRequest {
  isTwoFactorAuthEnabled: boolean;
  isAutoReplyEnabled: boolean;
}

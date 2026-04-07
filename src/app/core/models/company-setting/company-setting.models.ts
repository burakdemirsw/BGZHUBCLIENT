export interface CompanySetting {
  id: string;
  companyId: string;
  isTwoFactorAuthEnabled: boolean;
  isAutoReplyEnabled: boolean;
  isUseWorkHours: boolean;
  workHoursStart: string | null;
  workHoursEnd: string | null;
  createdDate: string;
  updatedDate: string;
}

export interface CreateCompanySettingRequest {
  companyId: string;
  isTwoFactorAuthEnabled: boolean;
  isAutoReplyEnabled: boolean;
  isUseWorkHours: boolean;
  workHoursStart: string | null;
  workHoursEnd: string | null;
}

export interface UpdateCompanySettingRequest {
  isTwoFactorAuthEnabled: boolean;
  isAutoReplyEnabled: boolean;
  isUseWorkHours: boolean;
  workHoursStart: string | null;
  workHoursEnd: string | null;
}

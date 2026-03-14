export interface AiSetting {
  id: string;
  settingDescription: string;
  definition?: string;
  value?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiSettingRequest {
  settingDescription: string;
  definition?: string;
  value?: string;
}

export interface UpdateAiSettingRequest {
  settingDescription: string;
  definition?: string;
  value?: string;
  isBlocked: boolean;
}

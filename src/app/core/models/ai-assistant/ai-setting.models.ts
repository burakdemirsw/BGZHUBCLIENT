export interface AiSetting {
  id: string;
  aiModelId: string;
  settingDescription: string;
  definition?: string;
  value?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiSettingRequest {
  aiModelId: string;
  settingDescription: string;
  definition?: string;
  value?: string;
}

export interface UpdateAiSettingRequest {
  aiModelId: string;
  settingDescription: string;
  definition?: string;
  value?: string;
  isBlocked: boolean;
}

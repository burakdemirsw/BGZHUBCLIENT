export interface AiProviderSetting {
  id: string;
  aiProviderId: string;
  settingId: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  providerFirmDescription?: string;
  settingDescription?: string;
}

export interface CreateAiProviderSettingRequest {
  aiProviderId: string;
  settingId: string;
}

export interface UpdateAiProviderSettingRequest {
  aiProviderId: string;
  settingId: string;
}

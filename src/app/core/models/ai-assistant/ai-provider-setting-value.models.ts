export interface AiProviderSettingValue {
  id: string;
  aiProviderId: string;
  aiProviderSettingDefinitionId: string;
  key: string;
  displayName: string;
  inputType: string;
  value?: string | null;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiProviderSettingValueRequest {
  aiProviderId: string;
  aiProviderSettingDefinitionId: string;
  value?: string | null;
}

export interface UpdateAiProviderSettingValueRequest {
  value?: string | null;
}

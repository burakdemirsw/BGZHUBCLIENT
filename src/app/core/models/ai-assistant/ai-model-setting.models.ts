export interface AiModelSetting {
  id: string;
  aiModelId: string;
  aiModelSettingDefinitionId: string;
  key: string;
  displayName: string;
  inputType: string;
  value?: string | null;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAiModelSettingRequest {
  aiModelId: string;
  aiModelSettingDefinitionId: string;
  value?: string | null;
}

export interface UpdateAiModelSettingRequest {
  value?: string | null;
}

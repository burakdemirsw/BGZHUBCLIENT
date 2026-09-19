export interface AiProviderSettingDefinition {
  id: string;
  aiProviderId: string;
  key: string;
  displayName: string;
  inputType: string;
  isRequired: boolean;
  placeholder?: string | null;
  defaultValue?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  aiProviderFirmDescription?: string;
}

export interface CreateAiProviderSettingDefinitionRequest {
  aiProviderId: string;
  key: string;
  displayName: string;
  inputType: string;
  isRequired: boolean;
  placeholder?: string | null;
  defaultValue?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateAiProviderSettingDefinitionRequest {
  key: string;
  displayName: string;
  inputType: string;
  isRequired: boolean;
  placeholder?: string | null;
  defaultValue?: string | null;
  sortOrder: number;
  isActive: boolean;
}

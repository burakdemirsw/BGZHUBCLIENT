export interface AiModelSettingDefinition {
  id: string;
  aiModelId: string;
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
  aiModelName?: string;
}

export interface CreateAiModelSettingDefinitionRequest {
  aiModelId: string;
  key: string;
  displayName: string;
  inputType: string;
  isRequired: boolean;
  placeholder?: string | null;
  defaultValue?: string | null;
  sortOrder: number;
  isActive?: boolean;
}

export interface UpdateAiModelSettingDefinitionRequest {
  key: string;
  displayName: string;
  inputType: string;
  isRequired: boolean;
  placeholder?: string | null;
  defaultValue?: string | null;
  sortOrder: number;
  isActive: boolean;
}

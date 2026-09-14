export interface ExtensionSettingDefinition {
    id: string;
    extensionId: string;
    key: string;
    displayName: string;
    inputType: string;
    isRequired: boolean;
    placeholder?: string;
    defaultValue?: string;
    sortOrder: number;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateExtensionSettingDefinitionRequest {
    extensionId: string;
    key: string;
    displayName: string;
    inputType: string;
    isRequired: boolean;
    placeholder?: string;
    defaultValue?: string;
    sortOrder: number;
    isActive?: boolean;
}

export interface UpdateExtensionSettingDefinitionRequest {
    key?: string;
    displayName: string;
    inputType: string;
    isRequired: boolean;
    placeholder?: string;
    defaultValue?: string;
    sortOrder: number;
    isActive: boolean;
}

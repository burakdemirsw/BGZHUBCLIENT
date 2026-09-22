export interface ExtensionSettingDefinition {
    id: string;
    extensionId: string;
    key: string;
    categoryCode: string;
    categoryName?: string | null;
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
    categoryCode?: string | null;
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
    categoryCode?: string | null;
}

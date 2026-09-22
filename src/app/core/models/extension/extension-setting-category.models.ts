export interface ExtensionSettingCategory {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    sortOrder: number;
    isActive: boolean;
    settingDefinitionCount: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateExtensionSettingCategoryRequest {
    code: string;
    name: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}

export interface UpdateExtensionSettingCategoryRequest {
    name: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
}

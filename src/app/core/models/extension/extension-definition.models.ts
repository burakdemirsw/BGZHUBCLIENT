export interface ExtensionDefinition {
    id: string;
    code: string;
    name: string;
    /** dbo.ExtensionCategories (Code) */
    categoryCode: string;
    categoryName?: string | null;
    mention?: string;
    photoUrl?: string;
    isActive: boolean;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateExtensionDefinitionRequest {
    code: string;
    name: string;
    categoryCode: string;
    mention?: string;
    photoUrl?: string;
    isActive?: boolean;
}

export interface UpdateExtensionDefinitionRequest {
    name: string;
    categoryCode: string;
    mention?: string;
    photoUrl?: string;
    isActive: boolean;
}

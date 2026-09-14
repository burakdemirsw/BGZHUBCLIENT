export interface ExtensionDefinition {
    id: string;
    code: string;
    name: string;
    category: string;
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
    category: string;
    mention?: string;
    photoUrl?: string;
    isActive?: boolean;
}

export interface UpdateExtensionDefinitionRequest {
    name: string;
    category: string;
    mention?: string;
    photoUrl?: string;
    isActive: boolean;
}

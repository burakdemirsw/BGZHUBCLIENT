export interface CompanyExtension {
    id: string;
    companyId: string;
    extensionId: string;
    extensionCode?: string;
    extensionName?: string;
    extensionCategory?: string;
    isEnabled: boolean;
    priority: number;
    photoUrl?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateCompanyExtensionRequest {
    companyId: string;
    extensionId: string;
    isEnabled: boolean;
    priority: number;
    photoUrl?: string;
}

export interface UpdateCompanyExtensionRequest {
    isEnabled: boolean;
    priority: number;
    photoUrl?: string;
}

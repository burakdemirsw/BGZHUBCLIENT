export interface CompanyExtensionSetting {
    id: string;
    companyId: string;
    extensionId: string;
    extensionCode?: string;
    extensionName?: string;
    key: string;
    value: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateCompanyExtensionSettingRequest {
    companyId: string;
    extensionId: string;
    key: string;
    value: string;
}

export interface UpdateCompanyExtensionSettingRequest {
    value: string;
}

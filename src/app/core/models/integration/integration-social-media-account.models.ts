export interface IntegrationSocialMediaAccount {
    id: string;
    companyId: string;
    integrationId: string;
    socialMediaAccountId: string;
    userId: string;
    integrationName?: string;
    socialMediaAccountName?: string;
    userName?: string;
    companyName?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateIntegrationSocialMediaAccountRequest {
    companyId: string;
    integrationId: string;
    socialMediaAccountId: string;
    userId: string;
}

export interface UpdateIntegrationSocialMediaAccountRequest {
    companyId: string;
    integrationId: string;
    socialMediaAccountId: string;
    userId: string;
}

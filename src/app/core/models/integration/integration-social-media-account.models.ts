export interface IntegrationSocialMediaAccount {
    id: string;
    integrationId: string;
    socialMediaAccountId: string;
    userId: string;
    integrationName?: string;
    socialMediaAccountName?: string;
    userName?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateIntegrationSocialMediaAccountRequest {
    integrationId: string;
    socialMediaAccountId: string;
    userId: string;
}

export interface UpdateIntegrationSocialMediaAccountRequest {
    integrationId: string;
    socialMediaAccountId: string;
    userId: string;
}

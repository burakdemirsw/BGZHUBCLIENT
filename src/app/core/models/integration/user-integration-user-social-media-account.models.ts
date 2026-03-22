export interface UserIntegrationUserSocialMediaAccount {
    id: string;
    companyId: string;
    integrationUserId: string;
    socialMediaAccountId: string;
    userId: string;
    integrationUserName?: string;
    socialMediaAccountName?: string;
    userName?: string;
    companyName?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateUserIntegrationUserSocialMediaAccountRequest {
    companyId: string;
    integrationUserId: string;
    socialMediaAccountId: string;
    userId: string;
}

export interface UpdateUserIntegrationUserSocialMediaAccountRequest {
    companyId: string;
    integrationUserId: string;
    socialMediaAccountId: string;
    userId: string;
}

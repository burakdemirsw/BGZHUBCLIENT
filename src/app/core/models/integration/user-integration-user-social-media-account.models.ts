export interface UserIntegrationUserSocialMediaAccountResponse {
    id: string;
    companyId: string;
    companyName?: string;
    userId: string;
    userName?: string;
    userLastName?: string;
    integrationUserId: string;
    integrationDescription?: string;
    userSocialMediaAccountId: string;
    socialMediaAccountName?: string;
    socialMediaAccountPhotoUrl?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateUserIntegrationUserSocialMediaAccountRequest {
    companyId: string;
    integrationUserId: string;
    userSocialMediaAccountId: string;
    userId: string;
}

export interface UpdateUserIntegrationUserSocialMediaAccountRequest {
    companyId: string;
    integrationUserId: string;
    userSocialMediaAccountId: string;
    userId: string;
}

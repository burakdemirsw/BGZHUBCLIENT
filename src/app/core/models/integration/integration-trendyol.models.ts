// Trendyol Integration Models

export interface ConnectTrendyolRequest {
    companyId: string;
    userId: string;
    integrationId: string;
    supplierId: string;
    apiKey: string;
    apiSecret: string;
}

export interface ConnectTrendyolResponse {
    integrationUserId: string;
    userSocialMediaAccountId: string;
    userIntegrationUserSocialMediaAccountId: string;
}

export interface UpdateTrendyolRequest {
    supplierId: string;
    apiKey: string;
    apiSecret: string;
}

export interface TrendyolResponse {
    id: string;
    supplierId: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

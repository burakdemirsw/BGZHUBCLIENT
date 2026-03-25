export interface PlanResponse {
    id: string;
    name?: string;
    description?: string;
    priceMonthly: number;
    priceYearly: number;
    maxMessageCount: number;
    maxConnectedWebsites: number;
    maxUserCount: number;
    maxConnectedSocialMediaAccountCount: number;
    sortOrder: number;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreatePlanRequest {
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    maxMessageCount: number;
    maxConnectedWebsites: number;
    maxUserCount: number;
    maxConnectedSocialMediaAccountCount: number;
    sortOrder: number;
}

export interface UpdatePlanRequest {
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    maxMessageCount: number;
    maxConnectedWebsites: number;
    maxUserCount: number;
    maxConnectedSocialMediaAccountCount: number;
    sortOrder: number;
    isActive: boolean;
}

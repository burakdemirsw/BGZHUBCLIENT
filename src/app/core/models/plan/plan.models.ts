export interface PlanResponse {
    id: string;
    name?: string;
    description?: string;
    priceMonthly: number;
    priceYearly?: number;
    maxChatCount?: number;  
    maxMessageCount?: number;
    marketplaceReplyRatio: number;
    maxConnectedChannels?: number;
    maxUserCount?: number;
    maxProductCount?: number;
    hasAllIntegrations: boolean;
    hasAllCommunicationChannels: boolean;
    sortOrder: number;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreatePlanRequest {
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly?: number;
    maxChatCount?: number;
    maxMessageCount?: number;
    marketplaceReplyRatio: number;
    maxConnectedChannels?: number;
    maxUserCount?: number;
    maxProductCount?: number;
    hasAllIntegrations: boolean;
    hasAllCommunicationChannels: boolean;
    sortOrder: number;
}

export interface UpdatePlanRequest {
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly?: number;
    maxChatCount?: number;
    maxMessageCount?: number;
    marketplaceReplyRatio: number;
    maxConnectedChannels?: number;
    maxUserCount?: number;
    maxProductCount?: number;
    hasAllIntegrations: boolean;
    hasAllCommunicationChannels: boolean;
    sortOrder: number;
    isActive: boolean;
}

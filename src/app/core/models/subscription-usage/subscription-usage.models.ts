export interface SubscriptionUsageResponse {
    id: string;
    companyId: string;
    companyName?: string;
    subscriptionId: string;
    periodStart: string;
    periodEnd: string;
    usedChatCount: number;
    usedMarketplaceReplyCount: number;
    usedChannelCount: number;
    usedUserCount: number;
    usedProductCount: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateSubscriptionUsageRequest {
    companyId: string;
    subscriptionId: string;
    periodStart: string;
    periodEnd: string;
}

export interface UpdateSubscriptionUsageRequest {
    usedChatCount: number;
    usedMarketplaceReplyCount: number;
    usedChannelCount: number;
    usedUserCount: number;
    usedProductCount: number;
}

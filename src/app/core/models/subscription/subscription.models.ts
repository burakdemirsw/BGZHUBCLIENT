export interface SubscriptionResponse {
    id: string;
    companyId: string;
    companyName?: string;
    planId: string;
    planName?: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isCancelled: boolean;
    cancelledDate?: string;
    cancelledUserId?: string;
    totalMessageLimit: number;
    usedMessageCount: number;
    remainMessageCount: number;
    createdDate?: string;
    updatedDate?: string;
}

export interface PlanDetailInfo {
    planId: string;
    name: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    currencyCode: string;
    maxMessageCount: number;
    maxConnectedWebsites: number;
    maxUserCount: number;
    maxConnectedSocialMediaAccountCount: number;
    isActive: boolean;
}

export interface SubscriptionPaymentInfo {
    id: string;
    amount: number;
    currency: string;
    paymentMethod?: string;
    paymentDate: string;
    isSuccess: boolean;
    errorMessage?: string;
}

export interface SubscriptionUsageInfo {
    id: string;
    periodStart: string;
    periodEnd: string;
    usedMessage: number;
}

export interface CompanySubscriptionDetailResponse {
    companyId: string;
    companyName?: string;
    hasActiveSubscription: boolean;
    subscriptionId?: string;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    isCancelled?: boolean;
    cancelledDate?: string;
    totalMessageLimit: number;
    usedMessageCount: number;
    remainMessageCount: number;
    usagePercentage: number;
    daysRemaining: number;
    plan?: PlanDetailInfo;
    payments: SubscriptionPaymentInfo[];
    usages: SubscriptionUsageInfo[];
}

export interface CreateSubscriptionRequest {
    companyId: string;
    planId: string;
    startDate: string;
    endDate: string;
}

export interface ChangeSubscriptionRequest {
    companyId: string;
    newPlanId: string;
}

export interface UpdateSubscriptionRequest {
    companyId: string;
    planId: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    isCancelled: boolean;
    cancelledDate?: string;
    cancelledUserId?: string;
}

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
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateSubscriptionRequest {
    companyId: string;
    planId: string;
    startDate: string;
    endDate: string;
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

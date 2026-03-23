export interface SubscriptionPaymentResponse {
    id: string;
    companyId: string;
    companyName?: string;
    subscriptionId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
    paymentDate: string;
    isSuccess: boolean;
    errorMessage?: string;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateSubscriptionPaymentRequest {
    companyId: string;
    subscriptionId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentDate: string;
    isSuccess: boolean;
    errorMessage: string;
}

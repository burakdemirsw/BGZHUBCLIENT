export interface PaymentStatus {
    id: string;
    name?: string;
    description?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreatePaymentStatusRequest {
    name: string;
    description: string;
}

export interface UpdatePaymentStatusRequest {
    name: string;
    description: string;
    isBlocked: boolean;
}

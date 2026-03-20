export interface PaymentType {
    id: string;
    name?: string;
    description?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreatePaymentTypeRequest {
    name: string;
    description: string;
}

export interface UpdatePaymentTypeRequest {
    name: string;
    description: string;
    isBlocked: boolean;
}

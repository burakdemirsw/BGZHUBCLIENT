export interface OrderStatus {
    id: string;
    name?: string;
    description?: string;
    color?: string;
    sortOrder?: number;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateOrderStatusRequest {
    name: string;
    description: string;
    color: string;
    sortOrder: number;
}

export interface UpdateOrderStatusRequest {
    name: string;
    description: string;
    color: string;
    sortOrder: number;
    isBlocked: boolean;
}

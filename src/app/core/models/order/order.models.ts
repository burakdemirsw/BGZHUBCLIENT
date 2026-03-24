export interface OrderStatusSummary {
    id: string;
    name?: string;
}

export interface PaymentTypeSummary {
    id: string;
    name?: string;
}

export interface OrderCustomerSummary {
    id: string;
    platformAccountId: string;
    platformUsername: string;
    platformName: string;
    isBlocked: boolean;
}

export interface OrderItemSummary {
    id: string;
    productId: string;
    productName?: string;
    productImageUrl?: string;
    quantity: number;
    unitPrice: number;
    discountRate: number;
    discountTotal: number;
    taxRate: number;
    taxTotal: number;
    totalPrice: number;
}

export interface OrderPaymentSummary {
    id: string;
    paymentTypeId: string;
    paymentTypeName?: string;
    paymentStatusId: string;
    paymentStatusName?: string;
    amount: number;
    currencyCode: string;
    referenceNo?: string;
    paymentDate: string;
}

export interface OrderAddressSummary {
    id: string;
    addressLine: string;
    postalCode?: string;
    isDefault: boolean;
}

export interface OrderWithCustomerResponse {
    id: string;
    integrationOrderNo?: string;
    integrationOrderId?: string;
    orderDate: string;
    orderTime: string;
    description?: string;
    currencyCode: string;
    isCompleted: boolean;
    isCancel: boolean;
    isCreatedByAgent: boolean;
    itemCount: number;
    totalAmount: number;
    orderStatus?: OrderStatusSummary;
    paymentType?: PaymentTypeSummary;
    customer?: OrderCustomerSummary;
    orderItems: OrderItemSummary[];
    orderPayments: OrderPaymentSummary[];
    address?: OrderAddressSummary;
}

// Geriye dönük uyumluluk
export type Order = OrderWithCustomerResponse;

export interface OrderItem {
    id: string;
    orderId?: string;
    productId?: string;
    quantity?: number;
    unitPrice?: number;
    discountRate?: number;
    taxRate?: number;
    totalPrice?: number;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
    product?: any;
}

export interface OrderPayment {
    id: string;
    orderId?: string;
    paymentTypeId?: string;
    paymentStatusId?: string;
    amount?: number;
    currencyCode?: string;
    referenceNo?: string;
    note?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
    paymentType?: any;
    paymentStatus?: any;
}

export interface CreateOrderRequest {
    integrationUserId: string;
    companyId: string;
    userId: string;
    customerId: string;
    orderStatusId: string;
    paymentTypeId?: string;
    addressId?: string;
    integrationOrderNo?: string;
    integrationOrderId?: string;
    orderDate: string;
    orderTime: string;
    description?: string;
    currencyCode?: string;
    isCreatedByAgent?: boolean;
    items?: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountRate?: number;
    taxRate?: number;
}

export interface CreateOrderPaymentRequest {
    orderId: string;
    paymentTypeId: string;
    paymentStatusId: string;
    amount: number;
    currencyCode?: string;
    referenceNo?: string;
    note?: string;
}

export interface UpdateOrderRequest {
    orderStatusId: string;
    paymentTypeId?: string;
    addressId?: string;
    description?: string;
    isCompleted: boolean;
    isCancel: boolean;
}

export interface UpdateOrderPaymentRequest {
    paymentTypeId: string;
    paymentStatusId: string;
    amount: number;
    currencyCode?: string;
    referenceNo?: string;
    note?: string;
    isBlocked: boolean;
}

export interface OrderFilterRequest {
    companyId: string;
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    orderStatusId?: string;
    paymentTypeId?: string;
    customerId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    isCompleted?: boolean;
    isCancel?: boolean;
    sortBy?: string;
    sortDescending?: boolean;
}

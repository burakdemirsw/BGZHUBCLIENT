export interface Order {
    id: string;
    integrationUserId?: string;
    companyId?: string;
    userId?: string;
    customerId?: string;
    orderStatusId?: string;
    paymentTypeId?: string;
    addressId?: string;
    integrationOrderNo?: string;
    integrationOrderId?: string;
    orderDate?: string;
    orderTime?: string;
    description?: string;
    currencyCode?: string;
    isCreatedByAgent?: boolean;
    isCompleted?: boolean;
    isCancel?: boolean;
    totalAmount?: number;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
    // İlişkili veriler (response'dan gelebilir)
    customer?: any;
    orderStatus?: any;
    paymentType?: any;
    user?: any;
    integrationUser?: any;
    items?: OrderItem[];
    payments?: OrderPayment[];
}

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

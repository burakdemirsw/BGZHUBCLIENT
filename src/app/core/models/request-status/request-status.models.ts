export interface RequestStatus {
    id: string;
    name: string;
    description: string;
    isBlocked: boolean;
}

export interface CreateRequestStatusRequest {
    name: string;
    description: string;
}

export interface UpdateRequestStatusRequest {
    name: string;
    description: string;
    isBlocked: boolean;
}

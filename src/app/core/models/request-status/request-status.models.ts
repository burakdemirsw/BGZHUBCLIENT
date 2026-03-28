export interface RequestStatusResponse {
    id: string;
    name: string;
    description: string;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
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

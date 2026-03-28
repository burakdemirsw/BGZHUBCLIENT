export interface RequestPriorityResponse {
    id: string;
    name: string;
    description: string;
    isDefault: boolean;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface CreateRequestPriorityRequest {
    name: string;
    description: string;
    isDefault?: boolean;
}

export interface UpdateRequestPriorityRequest {
    name: string;
    description: string;
    isDefault: boolean;
    isBlocked: boolean;
}

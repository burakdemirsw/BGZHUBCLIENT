export interface RequestCategory {
    id: string;
    name: string;
    description: string;
    isBlocked: boolean;
}

export interface CreateRequestCategoryRequest {
    name: string;
    description: string;
}

export interface UpdateRequestCategoryRequest {
    name: string;
    description: string;
    isBlocked: boolean;
}

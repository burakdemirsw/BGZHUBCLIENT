export interface RequestCategoryResponse {
    id: string;
    name: string;
    description: string;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
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

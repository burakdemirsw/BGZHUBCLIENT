export interface Tag {
    id: string;
    name?: string;
    color?: string;
    userId?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateTagRequest {
    name: string;
    color: string;
    userId: string;
}

export interface UpdateTagRequest {
    name: string;
    color: string;
    userId: string;
    isBlocked: boolean;
}

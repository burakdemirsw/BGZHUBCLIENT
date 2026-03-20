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
    userId: string;
    companyId: string;
    name: string;
    colorCode: string;
}

export interface UpdateTagRequest {
    name: string;
    colorCode: string;
    isBlocked: boolean;
}

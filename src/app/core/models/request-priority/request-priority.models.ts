export interface RequestPriority {
    id: string;
    name: string;
    description: string;
    level: number;
    colorCode: string;
    isBlocked: boolean;
}

export interface CreateRequestPriorityRequest {
    name: string;
    description: string;
    level: number;
    colorCode: string;
}

export interface UpdateRequestPriorityRequest {
    name: string;
    description: string;
    level: number;
    colorCode: string;
    isBlocked: boolean;
}

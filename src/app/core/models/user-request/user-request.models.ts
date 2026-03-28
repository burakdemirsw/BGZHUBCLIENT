export interface UserRequest {
    id: string;
    userId: string;
    assignedUserId?: string;
    categoryId: string;
    statusId: string;
    priorityId: string;
    subject: string;
    description: string;
    isBlocked: boolean;
    createdDate?: string;
    updatedDate?: string;
    closedDate?: string;
    // Expanded
    userName?: string;
    userLastName?: string;
    userEmail?: string;
    assignedUserName?: string;
    assignedUserLastName?: string;
    categoryName?: string;
    statusName?: string;
    priorityName?: string;
    priorityColorCode?: string;
}

export interface UserRequestResponse {
    id: string;
    userId: string;
    assignedUserId?: string | null;
    categoryId: string;
    statusId: string;
    priorityId: string;
    requestNo?: string | null;
    subject?: string | null;
    description?: string | null;
    closedDate?: string | null;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
    categoryName?: string | null;
    statusName?: string | null;
    priorityName?: string | null;
    userName?: string | null;
    assignedUserName?: string | null;
}

export interface CreateUserRequestRequest {
    userId: string;
    categoryId: string;
    subject: string;
    description: string;
}

export interface UpdateUserRequestRequest {
    assignedUserId: string | null;
    categoryId: string;
    statusId: string;
    priorityId: string;
    subject: string;
    description: string;
    isBlocked: boolean;
}

export interface UserRequestMessage {
    id: string;
    requestId: string;
    senderUserId: string;
    message: string;
    from?: string;
    createdDate?: string;
    // Expanded
    senderUserName?: string;
    senderUserLastName?: string;
    senderUserEmail?: string;
}

export interface UserRequestMessageResponse {
    id: string;
    requestId: string;
    senderUserId: string;
    message: string;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
    senderUserName?: string | null;
    from?: string | null;
}

export interface CreateUserRequestMessageRequest {
    requestId: string;
    senderUserId: string;
    message: string;
}

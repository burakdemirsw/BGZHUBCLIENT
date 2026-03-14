export interface UserRequest {
    id: string;
    integrationId: string;
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
    integrationName?: string;
}

export interface CreateUserRequestRequest {
    integrationId: string;
    userId: string;
    categoryId: string;
    priorityId: string;
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
    createdDate?: string;
    // Expanded
    senderUserName?: string;
    senderUserLastName?: string;
    senderUserEmail?: string;
}

export interface CreateUserRequestMessageRequest {
    requestId: string;
    senderUserId: string;
    message: string;
}

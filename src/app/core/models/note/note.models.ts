export interface Note {
    id: string;
    conversationId?: string;
    userId?: string;
    content?: string;
    title?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateNoteRequest {
    conversationId?: string;
    userId?: string;
    content?: string;
    title?: string;
}

export interface UpdateNoteRequest {
    conversationId?: string;
    userId?: string;
    content?: string;
    title?: string;
    isBlocked?: boolean;
}

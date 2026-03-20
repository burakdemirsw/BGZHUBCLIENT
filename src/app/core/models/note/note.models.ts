export interface Note {
    id: string;
    conversationId?: string;
    userId?: string;
    noteText?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateNoteRequest {
    conversationId?: string;
    userId?: string;
    noteText?: string;
}

export interface UpdateNoteRequest {
    conversationId?: string;
    userId?: string;
    noteText?: string;
    isBlocked?: boolean;
}

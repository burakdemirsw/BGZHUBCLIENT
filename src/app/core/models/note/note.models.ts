export interface Note {
    id: string;
    title?: string;
    content?: string;
    userId?: string;
    isBlocked?: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateNoteRequest {
    title: string;
    content: string;
    userId: string;
}

export interface UpdateNoteRequest {
    title: string;
    content: string;
    userId: string;
    isBlocked: boolean;
}

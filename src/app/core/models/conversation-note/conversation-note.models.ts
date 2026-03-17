export interface ConversationNote {
    id: string;
    conversationId?: string;
    noteId?: string;
    noteTitle?: string;
    noteContent?: string;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateConversationNoteRequest {
    conversationId: string;
    noteId: string;
}

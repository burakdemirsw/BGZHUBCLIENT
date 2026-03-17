import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateConversationNoteRequest } from '../models/conversation-note/conversation-note.models';

@Injectable({ providedIn: 'root' })
export class ConversationNotesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes', action: `${id}` });
    }

    getByConversation(conversationId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes', action: `by-conversation/${conversationId}` });
    }

    getByNote(noteId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes', action: `by-note/${noteId}` });
    }

    create(request: CreateConversationNoteRequest): Promise<any> {
        return this.http.post({ controller: 'ConversationNotes' }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'ConversationNotes', action: `delete/${id}` }, {});
    }
}

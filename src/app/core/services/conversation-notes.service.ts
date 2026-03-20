import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateConversationNoteRequest, UpdateConversationNoteRequest } from '../models/conversation-note/conversation-note.models';

@Injectable({ providedIn: 'root' })
export class ConversationNotesService {
    constructor(private http: HttpClientService) {}

    getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        let action = `?PageNumber=${pageNumber}&PageSize=${pageSize}`;
        if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
        return this.http.get_new({ controller: 'ConversationNotes', action });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes', action: `${id}` });
    }

    getByConversation(conversationId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes', action: `by-conversation/${conversationId}` });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'ConversationNotes', action: `by-user/${userId}` });
    }

    create(request: CreateConversationNoteRequest): Promise<any> {
        return this.http.post({ controller: 'ConversationNotes' }, request);
    }

    update(id: string, request: UpdateConversationNoteRequest): Promise<any> {
        return this.http.post({ controller: 'ConversationNotes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'ConversationNotes', action: `delete/${id}` }, {});
    }
}

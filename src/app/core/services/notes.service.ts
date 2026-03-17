import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateNoteRequest, UpdateNoteRequest } from '../models/note/note.models';

@Injectable({ providedIn: 'root' })
export class NotesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'Notes' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Notes', action: `${id}` });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'Notes', action: `by-user/${userId}` });
    }

    create(request: CreateNoteRequest): Promise<any> {
        return this.http.post({ controller: 'Notes' }, request);
    }

    update(id: string, request: UpdateNoteRequest): Promise<any> {
        return this.http.post({ controller: 'Notes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Notes', action: `delete/${id}` }, {});
    }
}

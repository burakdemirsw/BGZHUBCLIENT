import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateShortcutRequest, UpdateShortcutRequest } from '../models/shortcut/shortcut.models';

@Injectable({
    providedIn: 'root',
})
export class ShortcutsService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut' }, id);
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut', action: `by-user/${userId}` });
    }

    getByType(typeId: string): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut', action: `by-type/${typeId}` });
    }

    getShared(): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut', action: 'shared' });
    }

    getByShortCode(userId: string, shortCode: string): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut', action: `by-shortcode/${userId}/${shortCode}` });
    }

    create(request: CreateShortcutRequest): Promise<any> {
        return this.http.post({ controller: 'Shortcut' }, request);
    }

    update(id: string, request: UpdateShortcutRequest): Promise<any> {
        return this.http.post({ controller: 'Shortcut', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Shortcut', action: `delete/${id}` }, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateShortcutTypeRequest, UpdateShortcutTypeRequest } from '../models/shortcut/shortcut.models';

@Injectable({
    providedIn: 'root',
})
export class ShortcutTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut/types' });
    }

    getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        let action = `?PageNumber=${pageNumber}&PageSize=${pageSize}`;
        if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
        return this.http.get_new({ controller: 'Shortcut/types', action });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut/types' }, id);
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'Shortcut/types', action: `by-user/${userId}` });
    }

    create(request: CreateShortcutTypeRequest): Promise<any> {
        return this.http.post({ controller: 'Shortcut/types' }, request);
    }

    update(id: string, request: UpdateShortcutTypeRequest): Promise<any> {
        return this.http.post({ controller: 'Shortcut/types', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Shortcut/types', action: `delete/${id}` }, {});
    }
}

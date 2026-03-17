import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateTagRequest, UpdateTagRequest } from '../models/tag/tag.models';

@Injectable({ providedIn: 'root' })
export class TagsService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'Tags' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Tags', action: `${id}` });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'Tags', action: `by-user/${userId}` });
    }

    create(request: CreateTagRequest): Promise<any> {
        return this.http.post({ controller: 'Tags' }, request);
    }

    update(id: string, request: UpdateTagRequest): Promise<any> {
        return this.http.post({ controller: 'Tags', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Tags', action: `delete/${id}` }, {});
    }
}

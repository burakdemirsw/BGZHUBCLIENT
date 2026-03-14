import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestPriorityRequest, UpdateRequestPriorityRequest } from '../models/request-priority/request-priority.models';

@Injectable({
    providedIn: 'root',
})
export class RequestPrioritiesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'RequestPriorities' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'RequestPriorities', action: id });
    }

    create(request: CreateRequestPriorityRequest): Promise<any> {
        return this.http.post({ controller: 'RequestPriorities' }, request);
    }

    update(id: string, request: UpdateRequestPriorityRequest): Promise<any> {
        return this.http.post({ controller: 'RequestPriorities', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'RequestPriorities', action: `delete/${id}` }, {});
    }
}

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestPriorityRequest, UpdateRequestPriorityRequest } from '../models/request-priority/request-priority.models';

@Injectable({
    providedIn: 'root',
})
export class RequestPrioritiesService {
    constructor(private http: HttpClientService) {}

    getPaged(page: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        const params = `?PageNumber=${page}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`;
        return this.http.get_new({ controller: 'RequestPriorities', action: params });
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

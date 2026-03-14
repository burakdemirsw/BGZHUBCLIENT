import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestStatusRequest, UpdateRequestStatusRequest } from '../models/request-status/request-status.models';

@Injectable({
    providedIn: 'root',
})
export class RequestStatusesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'RequestStatuses' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'RequestStatuses', action: id });
    }

    create(request: CreateRequestStatusRequest): Promise<any> {
        return this.http.post({ controller: 'RequestStatuses' }, request);
    }

    update(id: string, request: UpdateRequestStatusRequest): Promise<any> {
        return this.http.post({ controller: 'RequestStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'RequestStatuses', action: `delete/${id}` }, {});
    }
}

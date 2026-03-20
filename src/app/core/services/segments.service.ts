import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateSegmentRequest, UpdateSegmentRequest } from '../models/customer/segment.models';

@Injectable({ providedIn: 'root' })
export class SegmentsService {
    constructor(private http: HttpClientService) {}

    getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        let action = `?PageNumber=${pageNumber}&PageSize=${pageSize}`;
        if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
        return this.http.get_new({ controller: 'Segments', action });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'Segments', action: id });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'Segments', action: `by-user/${userId}` });
    }

    create(request: CreateSegmentRequest): Promise<any> {
        return this.http.post({ controller: 'Segments' }, request);
    }

    update(id: string, request: UpdateSegmentRequest): Promise<any> {
        return this.http.post({ controller: 'Segments', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'Segments', action: `delete/${id}` }, {});
    }
}

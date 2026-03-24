import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateSegmentRequest, UpdateSegmentRequest } from '../models/customer/segment.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class SegmentsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'Segments', action: 'paged' },
            req ?? {}
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Segments', action: id });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Segments', action: `by-user/${userId}` });
    }

    create(request: CreateSegmentRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Segments' }, request);
    }

    update(id: string, request: UpdateSegmentRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Segments', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Segments', action: `delete/${id}` }, {});
    }
}

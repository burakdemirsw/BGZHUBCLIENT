import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestStatusRequest, UpdateRequestStatusRequest } from '../models/request-status/request-status.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class RequestStatusesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'RequestStatuses', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'RequestStatuses', action: id });
    }

    create(request: CreateRequestStatusRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestStatuses' }, request);
    }

    update(id: string, request: UpdateRequestStatusRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestStatuses', action: `delete/${id}` }, {});
    }
}

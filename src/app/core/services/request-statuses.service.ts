import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { RequestStatusResponse, CreateRequestStatusRequest, UpdateRequestStatusRequest } from '../models/request-status/request-status.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class RequestStatusesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<RequestStatusResponse>>> {
        return this.http.post<PagedResult<RequestStatusResponse>>(
            { controller: 'RequestStatuses', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<RequestStatusResponse>> {
        return this.http.get<RequestStatusResponse>({ controller: 'RequestStatuses', action: id });
    }

    create(request: CreateRequestStatusRequest): Promise<ApiResponse<RequestStatusResponse>> {
        return this.http.post<RequestStatusResponse>({ controller: 'RequestStatuses' }, request);
    }

    update(id: string, request: UpdateRequestStatusRequest): Promise<ApiResponse<RequestStatusResponse>> {
        return this.http.post<RequestStatusResponse>({ controller: 'RequestStatuses', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<RequestStatusResponse>> {
        return this.http.post<RequestStatusResponse>({ controller: 'RequestStatuses', action: `delete/${id}` }, {});
    }
}

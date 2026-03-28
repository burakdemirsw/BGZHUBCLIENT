import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { RequestPriorityResponse, CreateRequestPriorityRequest, UpdateRequestPriorityRequest } from '../models/request-priority/request-priority.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class RequestPrioritiesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<RequestPriorityResponse>>> {
        return this.http.post<PagedResult<RequestPriorityResponse>>(
            { controller: 'RequestPriorities', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<RequestPriorityResponse>> {
        return this.http.get<RequestPriorityResponse>({ controller: 'RequestPriorities', action: id });
    }

    create(request: CreateRequestPriorityRequest): Promise<ApiResponse<RequestPriorityResponse>> {
        return this.http.post<RequestPriorityResponse>({ controller: 'RequestPriorities' }, request);
    }

    update(id: string, request: UpdateRequestPriorityRequest): Promise<ApiResponse<RequestPriorityResponse>> {
        return this.http.post<RequestPriorityResponse>({ controller: 'RequestPriorities', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<RequestPriorityResponse>> {
        return this.http.post<RequestPriorityResponse>({ controller: 'RequestPriorities', action: `delete/${id}` }, {});
    }
}

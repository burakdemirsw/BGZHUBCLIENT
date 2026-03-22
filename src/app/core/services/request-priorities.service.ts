import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateRequestPriorityRequest, UpdateRequestPriorityRequest } from '../models/request-priority/request-priority.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class RequestPrioritiesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'RequestPriorities', action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'RequestPriorities', action: id });
    }

    create(request: CreateRequestPriorityRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestPriorities' }, request);
    }

    update(id: string, request: UpdateRequestPriorityRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestPriorities', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'RequestPriorities', action: `delete/${id}` }, {});
    }
}

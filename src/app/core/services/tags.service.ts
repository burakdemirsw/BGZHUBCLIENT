import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateTagRequest, UpdateTagRequest, Tag } from '../models/tag/tag.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class TagsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<Tag>>> {
        return this.http.post<PagedResult<Tag>>({ controller: 'Tags', action: 'paged' }, req ?? {});
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Tags', action: `${id}` });
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Tags', action: `by-user/${userId}` });
    }

    create(request: CreateTagRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Tags' }, request);
    }

    update(id: string, request: UpdateTagRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Tags', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Tags', action: `delete/${id}` }, {});
    }
}

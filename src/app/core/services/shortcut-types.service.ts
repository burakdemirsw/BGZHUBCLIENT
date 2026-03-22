import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateShortcutTypeRequest, UpdateShortcutTypeRequest } from '../models/shortcut/shortcut.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class ShortcutTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Shortcut/types' });
    }

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'Shortcut/types', action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Shortcut/types' }, id);
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Shortcut/types', action: `by-user/${userId}` });
    }

    create(request: CreateShortcutTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Shortcut/types' }, request);
    }

    update(id: string, request: UpdateShortcutTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Shortcut/types', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Shortcut/types', action: `delete/${id}` }, {});
    }
}

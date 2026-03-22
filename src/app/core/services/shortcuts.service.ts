import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateShortcutRequest, UpdateShortcutRequest } from '../models/shortcut/shortcut.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationQuery, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class ShortcutsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.get<PagedResult<any>>({ controller: 'Shortcut', action: buildPaginationQuery(req) });
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Shortcut' }, id);
    }

    getByUser(userId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Shortcut', action: `by-user/${userId}` });
    }

    getByType(typeId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Shortcut', action: `by-type/${typeId}` });
    }

    getShared(): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({ controller: 'Shortcut', action: 'shared' });
    }

    getByShortCode(userId: string, shortCode: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Shortcut', action: `by-shortcode/${userId}/${shortCode}` });
    }

    create(request: CreateShortcutRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Shortcut' }, request);
    }

    update(id: string, request: UpdateShortcutRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Shortcut', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Shortcut', action: `delete/${id}` }, {});
    }
}

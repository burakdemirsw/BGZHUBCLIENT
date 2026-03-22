import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ConversationsService {
    constructor(private http: HttpClientService) {}

    getSidebar(): Promise<ApiResponse<any>> {
        return this.http.get<any>({ controller: 'Conversations', action: 'sidebar' });
    }

    getList(type: string, page?: number, pageSize?: number, searchTerm?: string): Promise<ApiResponse<any>> {
        const params: string[] = [`Type=${type}`];
        if (page) params.push(`Page=${page}`);
        if (pageSize) params.push(`PageSize=${pageSize}`);
        if (searchTerm) params.push(`SearchTerm=${searchTerm}`);
        return this.http.get<any>({
            controller: 'Conversations',
            action: 'list',
            queryString: params.join('&'),
        });
    }

    getMessages(conversationId: string): Promise<ApiResponse<any[]>> {
        return this.http.get<any[]>({
            controller: 'Conversations',
            action: `${conversationId}/messages`,
        });
    }
}

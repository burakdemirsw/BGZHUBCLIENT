import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateConversationListDescriptionRequest,
    UpdateConversationListDescriptionRequest,
} from '../models/conversation/conversation-list.models';

@Injectable({ providedIn: 'root' })
export class ConversationListDescriptionsService {
    private controller = 'ConversationLists';

    constructor(private http: HttpClientService) {}

    getPaged(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        return this.http.get_new({
            controller: this.controller,
            action: `descriptions?PageNumber=${pageNumber}&PageSize=${pageSize}&SearchTerm=${encodeURIComponent(searchTerm)}`
        });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: this.controller, action: `descriptions/${id}` });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: this.controller, action: `descriptions/by-user/${userId}` });
    }

    create(body: CreateConversationListDescriptionRequest): Promise<any> {
        return this.http.post({ controller: this.controller, action: 'descriptions' }, body);
    }

    update(id: string, body: UpdateConversationListDescriptionRequest): Promise<any> {
        return this.http.post({ controller: this.controller, action: `descriptions/update/${id}` }, body);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: this.controller, action: `descriptions/delete/${id}` }, {});
    }
}

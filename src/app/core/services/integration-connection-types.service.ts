import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateIntegrationConnectionTypeRequest,
    UpdateIntegrationConnectionTypeRequest,
} from '../models/integration/integration-connection-type.models';

@Injectable({
    providedIn: 'root',
})
export class IntegrationConnectionTypesService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnectionTypes' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnectionTypes', action: `${id}` });
    }

    getByCode(code: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnectionTypes', action: `by-code/${code}` });
    }

    create(request: CreateIntegrationConnectionTypeRequest): Promise<any> {
        return this.http.post({ controller: 'IntegrationConnectionTypes' }, request);
    }

    update(id: string, request: UpdateIntegrationConnectionTypeRequest): Promise<any> {
        return this.http.post({ controller: 'IntegrationConnectionTypes', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'IntegrationConnectionTypes', action: `delete/${id}` }, {});
    }
}

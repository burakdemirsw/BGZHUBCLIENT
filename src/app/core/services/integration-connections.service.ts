import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateIntegrationConnectionRequest,
    UpdateIntegrationConnectionRequest,
} from '../models/integration/integration-connection.models';

@Injectable({
    providedIn: 'root',
})
export class IntegrationConnectionsService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnections' });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnections', action: `${id}` });
    }

    getByIntegration(integrationId: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnections', action: `by-integration/${integrationId}` });
    }

    getByType(connectionTypeId: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationConnections', action: `by-type/${connectionTypeId}` });
    }

    create(request: CreateIntegrationConnectionRequest): Promise<any> {
        return this.http.post({ controller: 'IntegrationConnections' }, request);
    }

    update(id: string, request: UpdateIntegrationConnectionRequest): Promise<any> {
        return this.http.post({ controller: 'IntegrationConnections', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'IntegrationConnections', action: `delete/${id}` }, {});
    }
}

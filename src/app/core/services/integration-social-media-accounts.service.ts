import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import {
    CreateIntegrationSocialMediaAccountRequest,
    UpdateIntegrationSocialMediaAccountRequest,
} from '../models/integration/integration-social-media-account.models';

@Injectable({
    providedIn: 'root',
})
export class IntegrationSocialMediaAccountsService {
    constructor(private http: HttpClientService) {}

    getAll(pageNumber: number = 1, pageSize: number = 10, searchTerm: string = '', companyId: string = ''): Promise<any> {
        let action = `?PageNumber=${pageNumber}&PageSize=${pageSize}`;
        if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
        if (companyId) action += `&CompanyId=${encodeURIComponent(companyId)}`;
        return this.http.get_new({ controller: 'IntegrationSocialMediaAccounts', action });
    }

    getByCompany(companyId: string, pageNumber: number = 1, pageSize: number = 10, searchTerm: string = ''): Promise<any> {
        let action = `by-company/${companyId}?PageNumber=${pageNumber}&PageSize=${pageSize}`;
        if (searchTerm) action += `&SearchTerm=${encodeURIComponent(searchTerm)}`;
        return this.http.get_new({ controller: 'IntegrationSocialMediaAccounts', action });
    }

    getById(id: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationSocialMediaAccounts', action: `${id}` });
    }

    getByIntegration(integrationId: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationSocialMediaAccounts', action: `by-integration/${integrationId}` });
    }

    getBySocialMedia(socialMediaAccountId: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationSocialMediaAccounts', action: `by-social-media/${socialMediaAccountId}` });
    }

    getByUser(userId: string): Promise<any> {
        return this.http.get_new({ controller: 'IntegrationSocialMediaAccounts', action: `by-user/${userId}` });
    }

    create(request: CreateIntegrationSocialMediaAccountRequest): Promise<any> {
        return this.http.post({ controller: 'IntegrationSocialMediaAccounts' }, request);
    }

    update(id: string, request: UpdateIntegrationSocialMediaAccountRequest): Promise<any> {
        return this.http.post({ controller: 'IntegrationSocialMediaAccounts', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<any> {
        return this.http.post({ controller: 'IntegrationSocialMediaAccounts', action: `delete/${id}` }, {});
    }
}

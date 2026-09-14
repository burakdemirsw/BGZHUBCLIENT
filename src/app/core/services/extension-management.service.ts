import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    ExtensionDefinition,
    CreateExtensionDefinitionRequest,
    UpdateExtensionDefinitionRequest,
} from '../models/extension/extension-definition.models';
import {
    CompanyExtension,
    CreateCompanyExtensionRequest,
    UpdateCompanyExtensionRequest,
} from '../models/extension/company-extension.models';
import {
    CompanyExtensionSetting,
    CreateCompanyExtensionSettingRequest,
    UpdateCompanyExtensionSettingRequest,
} from '../models/extension/company-extension-setting.models';
import {
    ExtensionSettingDefinition,
    CreateExtensionSettingDefinitionRequest,
    UpdateExtensionSettingDefinitionRequest,
} from '../models/extension/extension-setting-definition.models';

@Injectable({
    providedIn: 'root',
})
export class ExtensionManagementService {
    constructor(private http: HttpClientService) {}

    getExtensionDefinitions(): Promise<ApiResponse<ExtensionDefinition[]>> {
        return this.http.get<ExtensionDefinition[]>({ controller: 'CompanyExtensions', action: 'definitions' });
    }

    createExtensionDefinition(request: CreateExtensionDefinitionRequest): Promise<ApiResponse<ExtensionDefinition>> {
        return this.http.post<ExtensionDefinition>({ controller: 'CompanyExtensions', action: 'definitions' }, request);
    }

    updateExtensionDefinition(id: string, request: UpdateExtensionDefinitionRequest): Promise<ApiResponse<ExtensionDefinition>> {
        return this.http.post<ExtensionDefinition>({ controller: 'CompanyExtensions', action: `definitions/update/${id}` }, request);
    }

    deleteExtensionDefinition(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'CompanyExtensions', action: `definitions/delete/${id}` }, {});
    }

    getCompanyExtensions(companyId: string): Promise<ApiResponse<CompanyExtension[]>> {
        return this.http.get<CompanyExtension[]>({ controller: 'CompanyExtensions', action: `by-company/${companyId}` });
    }

    createCompanyExtension(request: CreateCompanyExtensionRequest): Promise<ApiResponse<CompanyExtension>> {
        return this.http.post<CompanyExtension>({ controller: 'CompanyExtensions' }, request);
    }

    updateCompanyExtension(id: string, request: UpdateCompanyExtensionRequest): Promise<ApiResponse<CompanyExtension>> {
        return this.http.post<CompanyExtension>({ controller: 'CompanyExtensions', action: `update/${id}` }, request);
    }

    deleteCompanyExtension(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'CompanyExtensions', action: `delete/${id}` }, {});
    }

    getCompanyExtensionSettings(companyId: string, extensionId: string): Promise<ApiResponse<CompanyExtensionSetting[]>> {
        return this.http.get<CompanyExtensionSetting[]>({
            controller: 'CompanyExtensions',
            action: `settings/${companyId}/${extensionId}`,
        });
    }

    createCompanyExtensionSetting(request: CreateCompanyExtensionSettingRequest): Promise<ApiResponse<CompanyExtensionSetting>> {
        return this.http.post<CompanyExtensionSetting>({ controller: 'CompanyExtensions', action: 'settings' }, request);
    }

    updateCompanyExtensionSetting(id: string, request: UpdateCompanyExtensionSettingRequest): Promise<ApiResponse<CompanyExtensionSetting>> {
        return this.http.post<CompanyExtensionSetting>({ controller: 'CompanyExtensions', action: `settings/update/${id}` }, request);
    }

    deleteCompanyExtensionSetting(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'CompanyExtensions', action: `settings/delete/${id}` }, {});
    }

    getExtensionSettingDefinitions(extensionId: string): Promise<ApiResponse<ExtensionSettingDefinition[]>> {
        return this.http.get<ExtensionSettingDefinition[]>({
            controller: 'CompanyExtensions',
            action: `definitions/${extensionId}/setting-keys`,
        });
    }

    createExtensionSettingDefinition(request: CreateExtensionSettingDefinitionRequest): Promise<ApiResponse<ExtensionSettingDefinition>> {
        return this.http.post<ExtensionSettingDefinition>({ controller: 'CompanyExtensions', action: 'definitions/setting-keys' }, request);
    }

    updateExtensionSettingDefinition(id: string, request: UpdateExtensionSettingDefinitionRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'CompanyExtensions', action: `definitions/setting-keys/update/${id}` }, request);
    }

    deleteExtensionSettingDefinition(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: 'CompanyExtensions', action: `definitions/setting-keys/delete/${id}` }, {});
    }
}

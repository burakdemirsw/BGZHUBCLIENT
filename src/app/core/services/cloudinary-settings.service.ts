import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CloudinarySettingResponse, CreateCloudinarySettingRequest, UpdateCloudinarySettingRequest } from '../models/cloudinary/cloudinary.models';

@Injectable({
    providedIn: 'root',
})
export class CloudinarySettingsService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<CloudinarySettingResponse[]>> {
        return this.http.get<CloudinarySettingResponse[]>({ controller: 'CloudinarySettings' });
    }

    getById(id: string): Promise<ApiResponse<CloudinarySettingResponse>> {
        return this.http.get<CloudinarySettingResponse>({ controller: 'CloudinarySettings' }, id);
    }

    create(request: CreateCloudinarySettingRequest): Promise<ApiResponse<CloudinarySettingResponse>> {
        return this.http.post<CloudinarySettingResponse>({ controller: 'CloudinarySettings' }, request);
    }

    update(id: string, request: UpdateCloudinarySettingRequest): Promise<ApiResponse<CloudinarySettingResponse>> {
        return this.http.post<CloudinarySettingResponse>({ controller: 'CloudinarySettings', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'CloudinarySettings', action: `delete/${id}` }, {});
    }
}

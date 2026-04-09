import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { AwsS3SettingResponse, CreateAwsS3SettingRequest, UpdateAwsS3SettingRequest } from '../models/aws-s3/aws-s3.models';

@Injectable({
    providedIn: 'root',
})
export class AwsS3SettingsService {
    constructor(private http: HttpClientService) {}

    getAll(): Promise<ApiResponse<AwsS3SettingResponse[]>> {
        return this.http.get<AwsS3SettingResponse[]>({ controller: 'AwsS3Settings' });
    }

    getById(id: string): Promise<ApiResponse<AwsS3SettingResponse>> {
        return this.http.get<AwsS3SettingResponse>({ controller: 'AwsS3Settings' }, id);
    }

    create(request: CreateAwsS3SettingRequest): Promise<ApiResponse<AwsS3SettingResponse>> {
        return this.http.post<AwsS3SettingResponse>({ controller: 'AwsS3Settings' }, request);
    }

    update(id: string, request: UpdateAwsS3SettingRequest): Promise<ApiResponse<AwsS3SettingResponse>> {
        return this.http.post<AwsS3SettingResponse>({ controller: 'AwsS3Settings', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'AwsS3Settings', action: `delete/${id}` }, {});
    }
}

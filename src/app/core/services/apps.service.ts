import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    AppResponse,
    AppUserResponse,
    CreateAppRequest,
    CreateAppUserRequest,
    UpdateAppRequest,
    UpdateAppUserRequest,
} from '../models/app/app.models';

const CONTROLLER = 'Apps';

/** Uygulamalar ve uygulama–kullanıcı bağları — /api/Apps */
@Injectable({
    providedIn: 'root',
})
export class AppsService {
    constructor(private http: HttpClientService) {}

    getApps(): Promise<ApiResponse<AppResponse[]>> {
        return this.http.get<AppResponse[]>({ controller: CONTROLLER });
    }

    getApp(id: string): Promise<ApiResponse<AppResponse>> {
        return this.http.get<AppResponse>({ controller: CONTROLLER }, id);
    }

    createApp(request: CreateAppRequest): Promise<ApiResponse<AppResponse>> {
        return this.http.post<AppResponse>({ controller: CONTROLLER }, request);
    }

    updateApp(id: string, request: UpdateAppRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: CONTROLLER, action: `update/${id}` }, request);
    }

    /** Kullanıcısı olan uygulama silinmez */
    deleteApp(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: CONTROLLER, action: `delete/${id}` }, {});
    }

    getAppUsers(applicationId: string): Promise<ApiResponse<AppUserResponse[]>> {
        return this.http.get<AppUserResponse[]>({ controller: CONTROLLER, action: `${applicationId}/users` });
    }

    getAppsByUser(userId: string): Promise<ApiResponse<AppUserResponse[]>> {
        return this.http.get<AppUserResponse[]>({ controller: CONTROLLER, action: `by-user/${userId}` });
    }

    getAppUser(id: string): Promise<ApiResponse<AppUserResponse>> {
        return this.http.get<AppUserResponse>({ controller: CONTROLLER, action: `users/${id}` });
    }

    createAppUser(request: CreateAppUserRequest): Promise<ApiResponse<AppUserResponse>> {
        return this.http.post<AppUserResponse>({ controller: CONTROLLER, action: 'users' }, request);
    }

    updateAppUser(id: string, request: UpdateAppUserRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: CONTROLLER, action: `users/update/${id}` }, request);
    }

    deleteAppUser(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: CONTROLLER, action: `users/delete/${id}` }, {});
    }
}

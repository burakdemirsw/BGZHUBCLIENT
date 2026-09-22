import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import {
    BackgroundJob,
    BackgroundJobExtensionSetting,
    BackgroundJobSetting,
    CreateBackgroundJobExtensionSettingRequest,
    CreateBackgroundJobSettingDefinitionRequest,
    UpdateBackgroundJobRequest,
    UpdateBackgroundJobSettingDefinitionRequest,
    UpsertBackgroundJobSettingRequest,
} from '../models/background-jobs/background-jobs.models';

const CONTROLLER = 'background-jobs';

/**
 * Arka plan servisleri — /api/background-jobs.
 * Bu controller REST fiilleri kullanır (PUT/DELETE); kayıtlar `code` ile adreslenir.
 */
@Injectable({
    providedIn: 'root',
})
export class BackgroundJobsService {
    constructor(private http: HttpClientService) {}

    getJobs(): Promise<ApiResponse<BackgroundJob[]>> {
        return this.http.get<BackgroundJob[]>({ controller: CONTROLLER });
    }

    getJob(code: string): Promise<ApiResponse<BackgroundJob>> {
        return this.http.get<BackgroundJob>({ controller: CONTROLLER, action: this.enc(code) });
    }

    updateJob(code: string, request: UpdateBackgroundJobRequest): Promise<ApiResponse<object>> {
        return this.http.put<object>({ controller: CONTROLLER, action: this.enc(code) }, request);
    }

    runNow(code: string): Promise<ApiResponse<object>> {
        return this.http.post<object>({ controller: CONTROLLER, action: `${this.enc(code)}/run-now` }, {});
    }

    upsertSetting(code: string, settingKey: string, request: UpsertBackgroundJobSettingRequest): Promise<ApiResponse<object>> {
        return this.http.put<object>(
            { controller: CONTROLLER, action: `${this.enc(code)}/settings/${this.enc(settingKey)}` },
            request,
        );
    }

    /** İşe özel değeri siler — ayar varsayılan değerine döner */
    deleteSetting(code: string, settingKey: string): Promise<ApiResponse<object>> {
        return this.http.delete<object>({ controller: CONTROLLER, action: `${this.enc(code)}/settings/${this.enc(settingKey)}` });
    }

    /** İşin ayar tanımlarını değerleriyle birlikte, sıraya göre listeler */
    getSettingDefinitions(code: string): Promise<ApiResponse<BackgroundJobSetting[]>> {
        return this.http.get<BackgroundJobSetting[]>({ controller: CONTROLLER, action: `${this.enc(code)}/setting-definitions` });
    }

    getSettingDefinition(code: string, settingKey: string): Promise<ApiResponse<BackgroundJobSetting>> {
        return this.http.get<BackgroundJobSetting>({
            controller: CONTROLLER,
            action: `${this.enc(code)}/setting-definitions/${this.enc(settingKey)}`,
        });
    }

    createSettingDefinition(
        code: string,
        request: CreateBackgroundJobSettingDefinitionRequest,
    ): Promise<ApiResponse<BackgroundJobSetting>> {
        return this.http.post<BackgroundJobSetting>({ controller: CONTROLLER, action: `${this.enc(code)}/setting-definitions` }, request);
    }

    updateSettingDefinition(
        code: string,
        settingKey: string,
        request: UpdateBackgroundJobSettingDefinitionRequest,
    ): Promise<ApiResponse<object>> {
        return this.http.put<object>(
            { controller: CONTROLLER, action: `${this.enc(code)}/setting-definitions/${this.enc(settingKey)}` },
            request,
        );
    }

    /** Tanımı ve işe girilmiş değerini siler */
    deleteSettingDefinition(code: string, settingKey: string): Promise<ApiResponse<object>> {
        return this.http.delete<object>({
            controller: CONTROLLER,
            action: `${this.enc(code)}/setting-definitions/${this.enc(settingKey)}`,
        });
    }

    // ── Ayar tanımı ↔ extension ayarı bağlantıları ──

    getExtensionSettings(code: string, settingKey: string): Promise<ApiResponse<BackgroundJobExtensionSetting[]>> {
        return this.http.get<BackgroundJobExtensionSetting[]>({ controller: CONTROLLER, action: this.extensionSettingsPath(code, settingKey) });
    }

    addExtensionSetting(
        code: string,
        settingKey: string,
        request: CreateBackgroundJobExtensionSettingRequest,
    ): Promise<ApiResponse<BackgroundJobExtensionSetting>> {
        return this.http.post<BackgroundJobExtensionSetting>(
            { controller: CONTROLLER, action: this.extensionSettingsPath(code, settingKey) },
            request,
        );
    }

    removeExtensionSetting(code: string, settingKey: string, id: string): Promise<ApiResponse<object>> {
        return this.http.delete<object>({ controller: CONTROLLER, action: `${this.extensionSettingsPath(code, settingKey)}/${id}` });
    }

    private extensionSettingsPath(code: string, settingKey: string): string {
        return `${this.enc(code)}/setting-definitions/${this.enc(settingKey)}/extension-settings`;
    }

    private enc(value: string): string {
        return encodeURIComponent(value);
    }
}

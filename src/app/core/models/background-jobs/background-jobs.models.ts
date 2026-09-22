/**
 * Arka plan servisleri (/api/background-jobs) modelleri — v1.yaml
 * `BackgroundJobResponse`, `BackgroundJobSettingResponse` ve ilgili request şemaları.
 * Kayıtlar `code` ile tanımlanır; yeni iş oluşturma/silme ucu yoktur.
 */

export interface BackgroundJobSetting {
    definitionId: string;
    key: string | null;
    displayName: string | null;
    description: string | null;
    dataType: string | null;
    inputType: string | null;
    isRequired: boolean;
    defaultValue: string | null;
    minValue: string | null;
    maxValue: string | null;
    sortOrder: number;
    isActive: boolean;
    /** İşe özel girilmiş değer; null ise varsayılan kullanılır */
    value: string | null;
    /** Çalışma anında geçerli değer (value ?? defaultValue) */
    effectiveValue: string | null;
}

export interface BackgroundJob {
    id: string;
    code: string | null;
    name: string | null;
    description: string | null;
    isEnabled: boolean;
    intervalSeconds: number;
    maxParallelism: number | null;
    lockTimeoutSeconds: number;
    nextRunDate: string;
    lockedUntil: string | null;
    lockedBy: string | null;
    lastRunStartDate: string | null;
    lastRunEndDate: string | null;
    lastRunStatus: number | null;
    lastErrorMessage: string | null;
    lastDurationMs: number | null;
    lastProcessedCount: number | null;
    settings: BackgroundJobSetting[] | null;
}

/** PUT /background-jobs/{code} — yalnızca gönderilen alanlar güncellenir */
export interface UpdateBackgroundJobRequest {
    isEnabled?: boolean | null;
    intervalSeconds?: number | null;
    maxParallelism?: number | null;
    lockTimeoutSeconds?: number | null;
}

/** PUT /background-jobs/{code}/settings/{settingKey} */
export interface UpsertBackgroundJobSettingRequest {
    value: string | null;
}

/** PUT /background-jobs/{code}/setting-definitions/{settingKey} */
export interface UpdateBackgroundJobSettingDefinitionRequest {
    displayName?: string | null;
    description?: string | null;
    defaultValue?: string | null;
    minValue?: string | null;
    maxValue?: string | null;
    isRequired?: boolean | null;
    sortOrder?: number | null;
    isActive?: boolean | null;
}

/** POST /background-jobs/{code}/setting-definitions */
export interface CreateBackgroundJobSettingDefinitionRequest {
    key: string | null;
    dataType: string | null;
    displayName?: string | null;
    description?: string | null;
    defaultValue?: string | null;
    minValue?: string | null;
    maxValue?: string | null;
    isRequired?: boolean;
    sortOrder?: number | null;
    isActive?: boolean;
}

/**
 * Bir iş ayar tanımı ile bir extension ayar tanımı arasındaki bağlantı —
 * /background-jobs/{code}/setting-definitions/{settingKey}/extension-settings
 */
export interface BackgroundJobExtensionSetting {
    id: string;
    backgroundJobSettingDefinitionId: string;
    jobCode: string;
    jobSettingKey: string;
    extensionSettingDefinitionId: string;
    extensionId: string;
    extensionCode: string;
    extensionSettingKey: string;
    extensionSettingDisplayName: string;
    extensionSettingCategoryCode: string;
    extensionSettingDefaultValue: string | null;
}

export interface CreateBackgroundJobExtensionSettingRequest {
    extensionSettingDefinitionId: string;
}

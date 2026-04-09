export interface CloudinarySettingResponse {
    id: string;
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
    isBlocked: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateCloudinarySettingRequest {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
}

export interface UpdateCloudinarySettingRequest {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
    isBlocked: boolean;
}

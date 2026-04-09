export interface AwsS3SettingResponse {
    id: string;
    region: string;
    bucketName: string;
    accessKey: string;
    secretKey: string;
    isActive: boolean;
    isBlocked: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateAwsS3SettingRequest {
    region: string;
    bucketName: string;
    accessKey: string;
    secretKey: string;
    isActive: boolean;
}

export interface UpdateAwsS3SettingRequest {
    region: string;
    bucketName: string;
    accessKey: string;
    secretKey: string;
    isActive: boolean;
    isBlocked: boolean;
}

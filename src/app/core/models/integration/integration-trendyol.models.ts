// Trendyol Integration Models

export interface ConnectTrendyolRequest {
    supplierId: string;
    apiKey: string;
    apiSecret: string;
}

export interface UpdateTrendyolRequest {
    supplierId: string;
    apiKey: string;
    apiSecret: string;
}

export interface TrendyolResponse {
    id: string;
    supplierId: string;
    apiKey: string;
    apiSecret: string;
    isActive: boolean;
    createdDate?: string;
    updatedDate?: string;
}

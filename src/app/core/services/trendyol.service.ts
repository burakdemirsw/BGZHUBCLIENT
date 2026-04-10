import { Injectable } from '@angular/core';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { ConnectTrendyolRequest, UpdateTrendyolRequest, TrendyolResponse, ConnectTrendyolResponse } from '@/app/core/models/integration/integration-trendyol.models';
import { ApiResponse } from '@/app/core/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class TrendyolService {
    private controller = 'Trendyol';

    constructor(private http: HttpClientService) { }

    async connect(request: ConnectTrendyolRequest): Promise<ApiResponse<ConnectTrendyolResponse>> {
        return this.http.post<ConnectTrendyolResponse>({ controller: this.controller, action: 'connect-trendyol' }, request);
    }

    async update(integrationUserId: string, request: UpdateTrendyolRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `update/${integrationUserId}` }, request);
    }

    async disconnect(integrationUserId: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `disconnect/${integrationUserId}` }, {});
    }

    async getDetails(integrationUserId: string): Promise<ApiResponse<TrendyolResponse>> {
        return this.http.get<TrendyolResponse>({ controller: this.controller, action: `getById/${integrationUserId}` });
    }

    async testConnection(integrationUserId: string, companyId: string): Promise<ApiResponse<boolean>> {
        return this.http.get<boolean>({ controller: this.controller, action: `test-connection?integrationUserId=${integrationUserId}&companyId=${companyId}` });
    }
}

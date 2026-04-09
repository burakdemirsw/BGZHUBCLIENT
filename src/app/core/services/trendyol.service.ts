import { Injectable } from '@angular/core';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { ConnectTrendyolRequest, UpdateTrendyolRequest, TrendyolResponse } from '@/app/core/models/integration/integration-trendyol.models';
import { ApiResponse } from '@/app/core/models/api-response.model';

@Injectable({
    providedIn: 'root'
})
export class TrendyolService {
    private controller = 'TrendyolController';

    constructor(private http: HttpClientService) { }

    async connect(request: ConnectTrendyolRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: 'connect' }, request);
    }

    async update(id: string, request: UpdateTrendyolRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `update/${id}` }, request);
    }

    async disconnect(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: `disconnect/${id}` }, {});
    }

    async getDetails(id: string): Promise<ApiResponse<TrendyolResponse>> {
        return this.http.get<TrendyolResponse>({ controller: this.controller, action: `getById/${id}` });
    }

    async testConnection(request: ConnectTrendyolRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: this.controller, action: 'test-connection' }, request);
    }
}

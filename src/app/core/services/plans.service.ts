import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreatePlanRequest, PlanResponse, UpdatePlanRequest } from '../models/plan/plan.models';

@Injectable({
    providedIn: 'root',
})
export class PlansService {
    constructor(private http: HttpClientService) {}

    getAll(params?: {
        companyId?: string;
        pageNumber?: number;
        pageSize?: number;
        searchTerm?: string;
        sortBy?: string;
        sortDescending?: boolean;
    }): Promise<ApiResponse<any>> {
        let qs = '';
        if (params) {
            const parts: string[] = [];
            if (params.companyId) parts.push(`CompanyId=${params.companyId}`);
            if (params.pageNumber != null) parts.push(`PageNumber=${params.pageNumber}`);
            if (params.pageSize != null) parts.push(`PageSize=${params.pageSize}`);
            if (params.searchTerm) parts.push(`SearchTerm=${encodeURIComponent(params.searchTerm)}`);
            if (params.sortBy) parts.push(`SortBy=${encodeURIComponent(params.sortBy)}`);
            if (params.sortDescending != null) parts.push(`SortDescending=${params.sortDescending}`);
            qs = parts.join('&');
        }
        return this.http.get<any>({ controller: 'Plans', queryString: qs || undefined });
    }

    getActive(): Promise<ApiResponse<PlanResponse[]>> {
        return this.http.get<PlanResponse[]>({ controller: 'Plans', action: 'active' });
    }

    getById(id: string): Promise<ApiResponse<PlanResponse>> {
        return this.http.get<PlanResponse>({ controller: 'Plans', action: id });
    }

    create(request: CreatePlanRequest): Promise<ApiResponse<PlanResponse>> {
        return this.http.post<PlanResponse>({ controller: 'Plans' }, request);
    }

    update(id: string, request: UpdatePlanRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Plans', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Plans', action: `delete/${id}` }, {});
    }
}

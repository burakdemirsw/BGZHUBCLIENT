import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { CreatePlanRequest, PlanResponse, UpdatePlanRequest } from '../models/plan/plan.models';

@Injectable({
    providedIn: 'root',
})
export class PlansService {
    constructor(private http: HttpClientService) {}

    getAll(req?: PaginationRequest): Promise<ApiResponse<PagedResult<PlanResponse>>> {
        return this.http.post<PagedResult<PlanResponse>>(
            { controller: 'Plans', action: 'paged' },
            buildPaginationRequest(req),
        );
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

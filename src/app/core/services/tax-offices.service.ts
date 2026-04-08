import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateTaxOfficeRequest, TaxOfficeResponse, UpdateTaxOfficeRequest } from '../models/tax-office/tax-office.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class TaxOfficesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<TaxOfficeResponse>>> {
        return this.http.post<PagedResult<TaxOfficeResponse>>(
            { controller: 'TaxOffices', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<TaxOfficeResponse>> {
        return this.http.get<TaxOfficeResponse>({
            controller: 'TaxOffices',
            action: `${id}`,
        });
    }

    create(request: CreateTaxOfficeRequest): Promise<ApiResponse<TaxOfficeResponse>> {
        return this.http.post<TaxOfficeResponse>({ controller: 'TaxOffices' }, request);
    }

    update(id: string, request: UpdateTaxOfficeRequest): Promise<ApiResponse<TaxOfficeResponse>> {
        return this.http.post<TaxOfficeResponse>(
            { controller: 'TaxOffices', action: `update/${id}` },
            request,
        );
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>(
            { controller: 'TaxOffices', action: `delete/${id}` },
            {},
        );
    }
}

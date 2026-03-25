import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';
import { CreateNeighbourhoodRequest, Neighbourhood, UpdateNeighbourhoodRequest } from '../models/address/address.models';

@Injectable({
    providedIn: 'root',
})
export class NeighbourhoodsService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<Neighbourhood>>> {
        return this.http.post<PagedResult<Neighbourhood>>(
            { controller: 'Neighbourhoods', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<Neighbourhood>> {
        return this.http.get<Neighbourhood>({ controller: 'Neighbourhoods', action: id });
    }

    getByDistrict(districtId: string): Promise<ApiResponse<Neighbourhood[]>> {
        return this.http.get<Neighbourhood[]>({ controller: 'Neighbourhoods', action: `by-district/${districtId}` });
    }

    create(request: CreateNeighbourhoodRequest): Promise<ApiResponse<Neighbourhood>> {
        return this.http.post<Neighbourhood>({ controller: 'Neighbourhoods' }, request);
    }

    update(id: string, request: UpdateNeighbourhoodRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Neighbourhoods', action: `update/${id}` }, request);
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'Neighbourhoods', action: `delete/${id}` }, {});
    }
}

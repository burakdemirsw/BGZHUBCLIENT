import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { CreateNeighbourhoodRequest, Neighbourhood, UpdateNeighbourhoodRequest } from '../models/address/address.models';

@Injectable({
    providedIn: 'root',
})
export class NeighbourhoodsService {
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
        return this.http.get<any>({ controller: 'Neighbourhoods', queryString: qs || undefined });
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

import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { CreateAddressTypeRequest, UpdateAddressTypeRequest } from '../models/customer/address-type.models';
import { ApiResponse } from '../models/api-response.model';
import { PaginationRequest, buildPaginationRequest, PagedResult } from '../models/pagination.model';

@Injectable({
    providedIn: 'root',
})
export class AddressTypesService {
    constructor(private http: HttpClientService) {}

    getPaged(req?: PaginationRequest): Promise<ApiResponse<PagedResult<any>>> {
        return this.http.post<PagedResult<any>>(
            { controller: 'AddressTypes', action: 'paged' },
            buildPaginationRequest(req),
        );
    }

    getById(id: string): Promise<ApiResponse<any>> {
        return this.http.get<any>({
            controller: 'AddressTypes',
            action: `${id}`,
        });
    }

    create(request: CreateAddressTypeRequest): Promise<ApiResponse<any>> {
        return this.http.post<any>({ controller: 'AddressTypes' }, request);
    }

    update(
        id: string,
        request: UpdateAddressTypeRequest,
    ): Promise<ApiResponse<any>> {
        return this.http.post<any>(
            { controller: 'AddressTypes', action: `update/${id}` },
            request,
        );
    }

    delete(id: string): Promise<ApiResponse<any>> {
        return this.http.post<any>(
            { controller: 'AddressTypes', action: `delete/${id}` },
            {},
        );
    }
}

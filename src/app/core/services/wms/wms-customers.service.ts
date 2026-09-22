import { Injectable } from '@angular/core';
import { WmsResourceService } from './wms-crud.service';
import { ApiResponse } from '../../models/api-response.model';
import { PagedResult } from '../../models/pagination.model';
import {
    CustomerResponse,
    UpdateCustomerRequest,
    WmsCustomerDetailResponse,
    WmsCustomerListItem,
    WmsCustomerListRequest,
} from '../../models/wms/customer-view.models';

/** /api/wms/customers — müşteri liste/detay görünümleri ve kart güncelleme */
@Injectable({ providedIn: 'root' })
export class WmsCustomersService extends WmsResourceService {
    protected readonly resource = 'customers';

    getList(request: Partial<WmsCustomerListRequest>): Promise<PagedResult<WmsCustomerListItem>> {
        return this.postListView<WmsCustomerListItem>(request);
    }

    getDetails(id: string): Promise<WmsCustomerDetailResponse | null> {
        return this.getDetailView<WmsCustomerDetailResponse>(id);
    }

    getById(id: string): Promise<ApiResponse<CustomerResponse>> {
        return this.http.get<CustomerResponse>(this.action(id));
    }

    update(id: string, request: UpdateCustomerRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>(this.action(`update/${id}`), request);
    }
}

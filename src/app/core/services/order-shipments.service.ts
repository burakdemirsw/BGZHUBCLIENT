import { inject, Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { AuthStateService } from './auth-state.service';
import { ApiResponse } from '../models/api-response.model';
import { DEFAULT_PAGINATION, PagedResult, PaginationRequest } from '../models/pagination.model';
import { environment } from '../../../environments/environment';
import {
    CreateOrderShipmentRequest,
    OrderShipmentResponse,
} from '../models/order-shipment/order-shipment.models';

/** OrderTracking uçları `/api` öneki olmadan sunucu kökünde yayınlanır */
const ROOT_URL = environment.apiBaseUrl.replace(/\/api\/?$/, '');

/**
 * Sipariş kargoları servisi — OrderShipmentController (/order-tracking/order-shipments/*).
 *
 * Siparişi iade talebinden bağımsız olarak kargo firmasına bildirir ve gönderileri listeler.
 * Personel uçlarıdır: `companyId` oturumdan alınır ve gövdeye burada eklenir, form alanı olarak
 * sorulmaz.
 */
@Injectable({ providedIn: 'root' })
export class OrderShipmentsService {
    private readonly http = inject(HttpClientService);
    private readonly authState = inject(AuthStateService);

    /** Şirketin gönderileri — arama sipariş / kargo / takip numarasında yapılır */
    async getPaged(request?: Partial<PaginationRequest>): Promise<PagedResult<OrderShipmentResponse>> {
        const response = await this.http.post<PagedResult<OrderShipmentResponse>>(
            { fullEndPoint: this.url('paged') },
            { ...DEFAULT_PAGINATION, ...request, companyId: this.companyId },
        );
        return PagedResult.from<OrderShipmentResponse>(response);
    }

    /** Siparişi kargo firmasına bildirir; başarılıysa kargo numarasını taşıyan gönderi döner */
    create(request: Omit<CreateOrderShipmentRequest, 'companyId'>): Promise<ApiResponse<OrderShipmentResponse>> {
        return this.http.post<OrderShipmentResponse>(
            { fullEndPoint: this.url('cargo') },
            { ...request, orderNo: request.orderNo.trim(), companyId: this.companyId },
        );
    }

    private get companyId(): string {
        return this.authState.profile?.companyId ?? '';
    }

    private url(path: string): string {
        return `${ROOT_URL}/order-tracking/order-shipments/${path}`;
    }
}

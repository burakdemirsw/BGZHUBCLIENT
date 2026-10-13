import { inject, Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { AuthStateService } from './auth-state.service';
import { ApiResponse } from '../models/api-response.model';
import { DEFAULT_PAGINATION, PagedResult, PaginationRequest } from '../models/pagination.model';
import { environment } from '../../../environments/environment';
import {
    CreateOrderTrackingLinkRequest,
    CreateReturnClaimByLinkRequest,
    OrderTrackingLinkOrderResponse,
    OrderTrackingLinkProviderResponse,
    OrderTrackingLinkResponse,
    OrderTrackingLinkResultResponse,
    OrderTrackingLinkTokenRequest,
    ReturnClaimDetailResponse,
    ReturnClaimResultResponse,
} from '../models/order-tracking/order-tracking.models';

/** OrderTracking uçları `/api` öneki olmadan sunucu kökünde yayınlanır */
const ROOT_URL = environment.apiBaseUrl.replace(/\/api\/?$/, '');

/**
 * Sipariş bağlantısı servisi — şirketin müşteriye SMS doğrulamasız gönderdiği link.
 *
 * Personel uçları (`links*`) şirketi oturumdan alır; `companyId` form alanı
 * olarak sorulmaz, gövdeye burada eklenir. Müşteri uçları (`link/*`) yalnızca
 * bağlantının anahtarını taşır — şirket, sağlayıcı ve sipariş backend'de
 * anahtardan çözülür.
 */
@Injectable({ providedIn: 'root' })
export class OrderTrackingLinksService {
    private readonly http = inject(HttpClientService);
    private readonly authState = inject(AuthStateService);

    // ────── Personel ──────

    /** Siparişe bağlantı açar; istenirse siparişin telefonuna SMS ile de gönderir */
    createLink(
        request: Omit<CreateOrderTrackingLinkRequest, 'companyId'>,
    ): Promise<ApiResponse<OrderTrackingLinkResultResponse>> {
        return this.http.post<OrderTrackingLinkResultResponse>(
            { fullEndPoint: this.url('links') },
            { ...request, orderNo: request.orderNo.trim(), companyId: this.companyId },
        );
    }

    /** Şirketin bağlantıları — arama sipariş numarasında yapılır */
    async getLinksPaged(request?: Partial<PaginationRequest>): Promise<PagedResult<OrderTrackingLinkResponse>> {
        const response = await this.http.post<PagedResult<OrderTrackingLinkResponse>>(
            { fullEndPoint: this.url('links/paged') },
            { ...DEFAULT_PAGINATION, ...request, companyId: this.companyId },
        );
        return PagedResult.from<OrderTrackingLinkResponse>(response);
    }

    /** Bağlantıyı kullanıma kapatır / yeniden açar */
    setLinkActive(id: string, isActive: boolean): Promise<ApiResponse<OrderTrackingLinkResponse>> {
        return this.http.post<OrderTrackingLinkResponse>(
            { fullEndPoint: this.url('links/status') },
            { companyId: this.companyId, id, isActive },
        );
    }

    /** Var olan bağlantıyı siparişin telefonuna SMS ile yeniden gönderir */
    sendLinkSms(id: string): Promise<ApiResponse<OrderTrackingLinkResultResponse>> {
        return this.http.post<OrderTrackingLinkResultResponse>(
            { fullEndPoint: this.url('links/sms') },
            { companyId: this.companyId, id },
        );
    }

    /** Bağlantı açılabilecek sağlayıcılar (şirkette etkin, sipariş okuması destekli) */
    getProviders(): Promise<ApiResponse<OrderTrackingLinkProviderResponse[]>> {
        return this.http.post<OrderTrackingLinkProviderResponse[]>(
            { fullEndPoint: this.url('links/providers') },
            { companyId: this.companyId },
        );
    }

    // ────── Müşteri (public) ──────

    /** Bağlantının siparişi — SMS doğrulaması istenmez */
    getLinkOrder(request: OrderTrackingLinkTokenRequest): Promise<ApiResponse<OrderTrackingLinkOrderResponse>> {
        return this.http.post<OrderTrackingLinkOrderResponse>({ fullEndPoint: this.url('link/order') }, request);
    }

    /** Bağlantının siparişine açılmış iade talepleri */
    getLinkReturnClaims(request: OrderTrackingLinkTokenRequest): Promise<ApiResponse<ReturnClaimDetailResponse[]>> {
        return this.http.post<ReturnClaimDetailResponse[]>({ fullEndPoint: this.url('link/return-claims') }, request);
    }

    /** Bağlantının siparişine iade talebi açar */
    createLinkReturnClaim(request: CreateReturnClaimByLinkRequest): Promise<ApiResponse<ReturnClaimResultResponse>> {
        return this.http.post<ReturnClaimResultResponse>({ fullEndPoint: this.url('link/return-claim') }, request);
    }

    private get companyId(): string {
        return this.authState.profile?.companyId ?? '';
    }

    private url(path: string): string {
        return `${ROOT_URL}/order-tracking/${path}`;
    }
}

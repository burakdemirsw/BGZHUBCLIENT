import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    CancelReturnClaimCargoRequest,
    CargoCompanyResponse,
    CompanyReturnClaimRequest,
    CreateReturnClaimCargoRequest,
    CreateReturnClaimRequest,
    OrderTrackingBrandRequest,
    OrderTrackingBrandResponse,
    OrderTrackingCargoTrackResponse,
    OrderTrackingDetailResponse,
    OrderTrackingOrderRequest,
    OrderTrackingSummaryResponse,
    OrderTrackingVerificationResponse,
    ReturnCatalogRequest,
    ReturnClaimCargoResponse,
    ReturnClaimCargoResultResponse,
    ReturnClaimCargoTrackingRequest,
    ReturnClaimCancelRequest,
    ReturnClaimCancelResponse,
    ReturnClaimDecisionRequest,
    ReturnClaimDecisionResponse,
    ReturnClaimDeleteRequest,
    ReturnClaimDetailResponse,
    ReturnClaimListResponse,
    ReturnClaimResultResponse,
    ReturnReasonOptionResponse,
    VerifyOrderTrackingRequest,
} from '../models/order-tracking/order-tracking.models';

/**
 * OrderTracking uçları `/api` öneki olmadan sunucu kökünde yayınlanıyor
 * (v1 (58).yaml: `/order-tracking/...`), bu yüzden istekler `fullEndPoint` ile atılır.
 */
const ROOT_URL = environment.apiBaseUrl.replace(/\/api\/?$/, '');

/**
 * Sipariş takip paneli servisi — OrderTrackingController karşılığı.
 *
 * Controller'ın tüm uçları POST'tur: şirket / eklenti / sipariş bilgisi URL'de
 * değil istek gövdesinde taşınır. Buradaki `companyId` oturumdan değil, public
 * panelin route parametresinden gelir (panelde token yok); bu yüzden gövdede
 * yer alması zorunludur — form alanı olarak sorulmaz.
 */
@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
    constructor(private http: HttpClientService) {}

    /** Doğrulama ekranında gösterilen marka adı / logosu */
    getBrand(request: OrderTrackingBrandRequest): Promise<ApiResponse<OrderTrackingBrandResponse>> {
        return this.http.post<OrderTrackingBrandResponse>({ fullEndPoint: this.url('brand') }, request);
    }

    /** Sipariş numarasıyla özet bilgi (doğrulama öncesi) */
    getOrderSummary(request: OrderTrackingOrderRequest): Promise<ApiResponse<OrderTrackingSummaryResponse>> {
        return this.http.post<OrderTrackingSummaryResponse>({ fullEndPoint: this.url('order') }, this.orderBody(request));
    }

    /** Siparişin tam detayı (ürünler, tutarlar, teslimat adresi) */
    getOrderDetail(request: OrderTrackingOrderRequest): Promise<ApiResponse<OrderTrackingDetailResponse>> {
        return this.http.post<OrderTrackingDetailResponse>(
            { fullEndPoint: this.url('order/detail') },
            this.orderBody(request),
        );
    }

    /** Siparişin iade kargolarının hareketleri (en yeni gönderi önce) */
    getReturnCargoTracking(request: OrderTrackingOrderRequest): Promise<ApiResponse<OrderTrackingCargoTrackResponse[]>> {
        return this.http.post<OrderTrackingCargoTrackResponse[]>(
            { fullEndPoint: this.url('order/return-cargo-tracking') },
            this.orderBody(request),
        );
    }

    /** Siparişin telefonuna SMS doğrulama kodu gönderir */
    sendVerificationCode(request: OrderTrackingOrderRequest): Promise<ApiResponse<OrderTrackingVerificationResponse>> {
        return this.http.post<OrderTrackingVerificationResponse>(
            { fullEndPoint: this.url('order/verification-code') },
            this.orderBody(request),
        );
    }

    /** Kodu doğrular ve siparişin tam detayını döner */
    verify(request: VerifyOrderTrackingRequest): Promise<ApiResponse<OrderTrackingDetailResponse>> {
        return this.http.post<OrderTrackingDetailResponse>(
            { fullEndPoint: this.url('order/verify') },
            this.orderBody(request),
        );
    }

    /** İade nedenleri — 1. adımdaki "Neden iade ediyorsunuz?" listesi */
    getReturnReasons(request: ReturnCatalogRequest): Promise<ApiResponse<ReturnReasonOptionResponse[]>> {
        return this.http.post<ReturnReasonOptionResponse[]>({ fullEndPoint: this.url('return-reasons') }, request);
    }

    /**
     * İade sonrası işlem tipleri — 2. adımdaki "Nasıl bir işlem talep ediyorsunuz?" listesi.
     * Seçenekler tüm şirketlerde ortak olduğu için gövde almaz.
     */
    getAfterReturnActions(): Promise<ApiResponse<AfterReturnActionOptionResponse[]>> {
        return this.http.post<AfterReturnActionOptionResponse[]>({ fullEndPoint: this.url('after-return-actions') }, {});
    }

    /** Talep öncesi bilgilendirme maddeleri — uyarı modalının içeriği */
    getBeforeClaimInstructions(
        request: ReturnCatalogRequest,
    ): Promise<ApiResponse<BeforeClaimInstructionOptionResponse[]>> {
        return this.http.post<BeforeClaimInstructionOptionResponse[]>(
            { fullEndPoint: this.url('before-claim-instructions') },
            request,
        );
    }

    /** İade paketinin gönderilebileceği kargo şirketleri — 3. adım */
    getCargoCompanies(request: ReturnCatalogRequest): Promise<ApiResponse<CargoCompanyResponse[]>> {
        return this.http.post<CargoCompanyResponse[]>({ fullEndPoint: this.url('cargo-companies') }, request);
    }

    /** İade talebi oluşturur, iade kargo kodunu döner */
    createReturnClaim(request: CreateReturnClaimRequest): Promise<ApiResponse<ReturnClaimResultResponse>> {
        return this.http.post<ReturnClaimResultResponse>(
            { fullEndPoint: this.url('return-claim') },
            this.orderBody(request),
        );
    }

    /** Siparişe açılmış iade talepleri — özet liste */
    getReturnClaims(request: OrderTrackingOrderRequest): Promise<ApiResponse<ReturnClaimListResponse[]>> {
        return this.http.post<ReturnClaimListResponse[]>(
            { fullEndPoint: this.url('return-claims') },
            this.orderBody(request),
        );
    }

    /** Siparişe açılmış iade talepleri (kod açıklamaları, kargo bilgisi, satırlar) */
    getReturnClaimDetails(request: OrderTrackingOrderRequest): Promise<ApiResponse<ReturnClaimDetailResponse[]>> {
        return this.http.post<ReturnClaimDetailResponse[]>(
            { fullEndPoint: this.url('return-claims/detail') },
            this.orderBody(request),
        );
    }

    /** Siparişin iade taleplerinde oluşmuş kargo gönderileri */
    getReturnClaimCargos(request: OrderTrackingOrderRequest): Promise<ApiResponse<ReturnClaimCargoResponse[]>> {
        return this.http.post<ReturnClaimCargoResponse[]>(
            { fullEndPoint: this.url('return-claims/cargos') },
            this.orderBody(request),
        );
    }

    /** Personel ekranı: talebin iade kargosunun hareketleri */
    getReturnClaimCargoTracking(
        request: ReturnClaimCargoTrackingRequest,
    ): Promise<ApiResponse<OrderTrackingCargoTrackResponse[]>> {
        return this.http.post<OrderTrackingCargoTrackResponse[]>(
            { fullEndPoint: this.url('return-claims/cargo-tracking') },
            { ...request, claimNumber: request.claimNumber.trim() },
        );
    }

    /** Şirketin iade talepleri — tarih aralığı / talep numarasıyla filtrelenebilir */
    getCompanyReturnClaims(request: CompanyReturnClaimRequest): Promise<ApiResponse<ReturnClaimDetailResponse[]>> {
        return this.http.post<ReturnClaimDetailResponse[]>(
            { fullEndPoint: this.url('return-claims/by-company') },
            request,
        );
    }

    /**
     * Talebi onaylar (durum: Kabul) ve müşteriye bilgilendirme SMS'i gönderir.
     * Personel işlemidir; SMS gönderilemese bile karar korunur, sebebi yanıtta döner.
     */
    approveReturnClaim(request: ReturnClaimDecisionRequest): Promise<ApiResponse<ReturnClaimDecisionResponse>> {
        return this.decideReturnClaim('approve', request);
    }

    /** Talebi reddeder (durum: Red) ve müşteriye bilgilendirme SMS'i gönderir. */
    rejectReturnClaim(request: ReturnClaimDecisionRequest): Promise<ApiResponse<ReturnClaimDecisionResponse>> {
        return this.decideReturnClaim('reject', request);
    }

    /**
     * Talebi iptal eder (durum: İptal). Açık kargo gönderisi firmada da iptal edilir;
     * firma iptali başaramazsa talep yine iptal edilir, sebebi `cargoError`'da döner.
     */
    cancelReturnClaim(request: ReturnClaimCancelRequest): Promise<ApiResponse<ReturnClaimCancelResponse>> {
        return this.http.post<ReturnClaimCancelResponse>(
            { fullEndPoint: this.url('return-claims/cancel') },
            { ...request, claimNumber: request.claimNumber.trim() },
        );
    }

    /** Talebi satırları ve gönderi kayıtlarıyla birlikte kalıcı olarak siler */
    deleteReturnClaim(request: ReturnClaimDeleteRequest): Promise<ApiResponse<object>> {
        return this.http.post<object>(
            { fullEndPoint: this.url('return-claims/delete') },
            { ...request, claimNumber: request.claimNumber.trim() },
        );
    }

    /** Talebe iade kargo gönderisi oluşturur, ZPL etiketlerini döner */
    createReturnClaimCargo(
        request: CreateReturnClaimCargoRequest,
    ): Promise<ApiResponse<ReturnClaimCargoResultResponse>> {
        return this.http.post<ReturnClaimCargoResultResponse>(
            { fullEndPoint: this.url('return-claims/cargo') },
            this.claimCargoBody(request),
        );
    }

    /** Oluşturulmuş iade kargo gönderisini iptal eder */
    cancelReturnClaimCargo(request: CancelReturnClaimCargoRequest): Promise<ApiResponse<ReturnClaimCargoResponse>> {
        return this.http.post<ReturnClaimCargoResponse>(
            { fullEndPoint: this.url('return-claims/cargo/cancel') },
            this.claimCargoBody(request),
        );
    }

    private decideReturnClaim(
        decision: 'approve' | 'reject',
        request: ReturnClaimDecisionRequest,
    ): Promise<ApiResponse<ReturnClaimDecisionResponse>> {
        return this.http.post<ReturnClaimDecisionResponse>(
            { fullEndPoint: this.url(`return-claims/${decision}`) },
            { ...request, claimNumber: request.claimNumber.trim() },
        );
    }

    /** Sipariş numarası kullanıcıdan geldiği için gönderimden önce sadeleştirilir */
    private orderBody<T extends OrderTrackingOrderRequest>(request: T): T {
        return { ...request, orderNo: request.orderNo.trim() };
    }

    private claimCargoBody<T extends OrderTrackingOrderRequest & { claimNumber: string }>(request: T): T {
        return { ...this.orderBody(request), claimNumber: request.claimNumber.trim() };
    }

    private url(path: string): string {
        return `${ROOT_URL}/order-tracking/${path}`;
    }
}

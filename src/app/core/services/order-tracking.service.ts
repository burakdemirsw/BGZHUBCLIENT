import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    CargoCompanyResponse,
    CreateReturnClaimRequest,
    OrderTrackingBrandResponse,
    OrderTrackingDetailResponse,
    OrderTrackingSummaryResponse,
    OrderTrackingVerificationResponse,
    ReturnClaimDecisionRequest,
    ReturnClaimDecisionResponse,
    ReturnClaimDetailResponse,
    ReturnClaimResultResponse,
    ReturnReasonOptionResponse,
    VerifyOrderTrackingRequest,
} from '../models/order-tracking/order-tracking.models';

/**
 * OrderTracking uçları `/api` öneki olmadan sunucu kökünde yayınlanıyor
 * (v1.yaml: `/order-tracking/...`), bu yüzden istekler `fullEndPoint` ile atılır.
 */
const ROOT_URL = environment.apiBaseUrl.replace(/\/api\/?$/, '');

/** Sipariş takip paneli servisi — OrderTrackingController karşılığı */
@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
    constructor(private http: HttpClientService) {}

    /** Doğrulama ekranında gösterilen marka adı / logosu */
    getBrand(companyId: string, extensionId: string): Promise<ApiResponse<OrderTrackingBrandResponse>> {
        return this.http.get<OrderTrackingBrandResponse>({
            fullEndPoint: `${ROOT_URL}/order-tracking/brand/${companyId}/${extensionId}`,
        });
    }

    /** Sipariş numarasıyla özet bilgi (doğrulama öncesi) */
    getOrderSummary(
        companyId: string,
        extensionId: string,
        orderNo: string,
    ): Promise<ApiResponse<OrderTrackingSummaryResponse>> {
        return this.http.get<OrderTrackingSummaryResponse>({
            fullEndPoint: this.orderUrl(companyId, extensionId, orderNo),
        });
    }

    /** Siparişin tam detayı (ürünler, tutarlar, teslimat adresi) */
    getOrderDetail(
        companyId: string,
        extensionId: string,
        orderNo: string,
    ): Promise<ApiResponse<OrderTrackingDetailResponse>> {
        return this.http.get<OrderTrackingDetailResponse>({
            fullEndPoint: `${this.orderUrl(companyId, extensionId, orderNo)}/detail`,
        });
    }

    /** Siparişin telefonuna SMS doğrulama kodu gönderir */
    sendVerificationCode(
        companyId: string,
        extensionId: string,
        orderNo: string,
    ): Promise<ApiResponse<OrderTrackingVerificationResponse>> {
        return this.http.post<OrderTrackingVerificationResponse>(
            { fullEndPoint: `${this.orderUrl(companyId, extensionId, orderNo)}/verification-code` },
            {},
        );
    }

    /** Kodu doğrular ve siparişin tam detayını döner */
    verify(
        companyId: string,
        extensionId: string,
        orderNo: string,
        request: VerifyOrderTrackingRequest,
    ): Promise<ApiResponse<OrderTrackingDetailResponse>> {
        return this.http.post<OrderTrackingDetailResponse>(
            { fullEndPoint: `${this.orderUrl(companyId, extensionId, orderNo)}/verify` },
            request,
        );
    }

    /** İade nedenleri — 1. adımdaki "Neden iade ediyorsunuz?" listesi */
    getReturnReasons(companyId: string): Promise<ApiResponse<ReturnReasonOptionResponse[]>> {
        return this.http.get<ReturnReasonOptionResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/return-reasons`,
        });
    }

    /**
     * İade sonrası işlem tipleri — 2. adımdaki "Nasıl bir işlem talep ediyorsunuz?" listesi.
     * Seçenekler tüm şirketlerde ortak olduğu için uç şirket parametresi almaz.
     */
    getAfterReturnActions(): Promise<ApiResponse<AfterReturnActionOptionResponse[]>> {
        return this.http.get<AfterReturnActionOptionResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/after-return-actions`,
        });
    }

    /** Talep öncesi bilgilendirme maddeleri — uyarı modalının içeriği */
    getBeforeClaimInstructions(companyId: string): Promise<ApiResponse<BeforeClaimInstructionOptionResponse[]>> {
        return this.http.get<BeforeClaimInstructionOptionResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/before-claim-instructions`,
        });
    }

    /** İade paketinin gönderilebileceği kargo şirketleri — 3. adım */
    getCargoCompanies(companyId: string): Promise<ApiResponse<CargoCompanyResponse[]>> {
        return this.http.get<CargoCompanyResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/cargo-companies`,
        });
    }

    /** İade talebi oluşturur, iade kargo kodunu döner */
    createReturnClaim(
        companyId: string,
        extensionId: string,
        orderNo: string,
        request: CreateReturnClaimRequest,
    ): Promise<ApiResponse<ReturnClaimResultResponse>> {
        return this.http.post<ReturnClaimResultResponse>(
            { fullEndPoint: `${this.orderUrl(companyId, extensionId, orderNo)}/return-claim` },
            request,
        );
    }

    /** Siparişe açılmış iade talepleri (kod açıklamaları, kargo bilgisi, satırlar) */
    getReturnClaimDetails(
        companyId: string,
        extensionId: string,
        orderNo: string,
    ): Promise<ApiResponse<ReturnClaimDetailResponse[]>> {
        return this.http.get<ReturnClaimDetailResponse[]>({
            fullEndPoint: `${this.orderUrl(companyId, extensionId, orderNo)}/return-claims/detail`,
        });
    }

    /**
     * Talebi onaylar (durum: Kabul) ve müşteriye bilgilendirme SMS'i gönderir.
     * Personel işlemidir; SMS gönderilemese bile karar korunur, sebebi yanıtta döner.
     */
    approveReturnClaim(
        companyId: string,
        extensionId: string,
        orderNo: string,
        claimNumber: string,
        request: ReturnClaimDecisionRequest,
    ): Promise<ApiResponse<ReturnClaimDecisionResponse>> {
        return this.decideReturnClaim('approve', companyId, extensionId, orderNo, claimNumber, request);
    }

    /** Talebi reddeder (durum: Red) ve müşteriye bilgilendirme SMS'i gönderir. */
    rejectReturnClaim(
        companyId: string,
        extensionId: string,
        orderNo: string,
        claimNumber: string,
        request: ReturnClaimDecisionRequest,
    ): Promise<ApiResponse<ReturnClaimDecisionResponse>> {
        return this.decideReturnClaim('reject', companyId, extensionId, orderNo, claimNumber, request);
    }

    private decideReturnClaim(
        decision: 'approve' | 'reject',
        companyId: string,
        extensionId: string,
        orderNo: string,
        claimNumber: string,
        request: ReturnClaimDecisionRequest,
    ): Promise<ApiResponse<ReturnClaimDecisionResponse>> {
        const claimSegment = encodeURIComponent(claimNumber.trim());
        return this.http.post<ReturnClaimDecisionResponse>(
            {
                fullEndPoint:
                    `${this.orderUrl(companyId, extensionId, orderNo)}/return-claims/${claimSegment}/${decision}`,
            },
            request,
        );
    }

    private orderUrl(companyId: string, extensionId: string, orderNo: string): string {
        return `${ROOT_URL}/order-tracking/${companyId}/${extensionId}/${encodeURIComponent(orderNo.trim())}`;
    }
}

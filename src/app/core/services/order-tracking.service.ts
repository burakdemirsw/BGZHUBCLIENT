import { Injectable } from '@angular/core';
import { HttpClientService } from './http-client.service';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import {
    AfterReturnActionOptionResponse,
    BeforeClaimInstructionOptionResponse,
    OrderTrackingBrandResponse,
    OrderTrackingResponse,
    OrderTrackingVerificationResponse,
    ReturnReasonOptionResponse,
    VerifyOrderTrackingRequest,
} from '../models/order-tracking/order-tracking.models';

/**
 * OrderTracking uçları `/api` öneki olmadan sunucu kökünde yayınlanıyor
 * (v1.yaml: `/order-tracking/...`), bu yüzden istekler `fullEndPoint` ile atılır.
 */
const ROOT_URL = environment.apiBaseUrl.replace(/\/api\/?$/, '');

/** Sipariş takip paneli servisi — OrderTracking controller karşılığı */
@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
    constructor(private http: HttpClientService) {}

    /** Doğrulama ekranında gösterilen marka adı / logosu */
    getBrand(companyId: string, extensionId: string): Promise<ApiResponse<OrderTrackingBrandResponse>> {
        return this.http.get<OrderTrackingBrandResponse>({
            fullEndPoint: `${ROOT_URL}/order-tracking/brand/${companyId}/${extensionId}`,
        });
    }

    /** Sipariş numarasıyla sipariş bilgisi */
    getOrder(companyId: string, extensionId: string, orderNo: string): Promise<ApiResponse<OrderTrackingResponse>> {
        return this.http.get<OrderTrackingResponse>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/${extensionId}/${this.encode(orderNo)}`,
        });
    }

    /** Siparişin telefonuna SMS doğrulama kodu gönderir */
    sendVerificationCode(
        companyId: string,
        extensionId: string,
        orderNo: string,
    ): Promise<ApiResponse<OrderTrackingVerificationResponse>> {
        return this.http.post<OrderTrackingVerificationResponse>(
            { fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/${extensionId}/${this.encode(orderNo)}/verification-code` },
            {},
        );
    }

    /** Kodu doğrular ve siparişin tam detayını döner */
    verify(
        companyId: string,
        extensionId: string,
        orderNo: string,
        request: VerifyOrderTrackingRequest,
    ): Promise<ApiResponse<OrderTrackingResponse>> {
        return this.http.post<OrderTrackingResponse>(
            { fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/${extensionId}/${this.encode(orderNo)}/verify` },
            request,
        );
    }

    /** İade nedenleri — 1. adımdaki "Neden iade ediyorsunuz?" listesi */
    getReturnReasons(companyId: string): Promise<ApiResponse<ReturnReasonOptionResponse[]>> {
        return this.http.get<ReturnReasonOptionResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/return-reasons`,
        });
    }

    /** İade sonrası işlem tipleri — 2. adımdaki "Nasıl bir işlem talep ediyorsunuz?" listesi */
    getAfterReturnActions(companyId: string): Promise<ApiResponse<AfterReturnActionOptionResponse[]>> {
        return this.http.get<AfterReturnActionOptionResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/after-return-actions`,
        });
    }

    /** Talep öncesi bilgilendirme maddeleri — uyarı modalının içeriği */
    getBeforeClaimInstructions(companyId: string): Promise<ApiResponse<BeforeClaimInstructionOptionResponse[]>> {
        return this.http.get<BeforeClaimInstructionOptionResponse[]>({
            fullEndPoint: `${ROOT_URL}/order-tracking/${companyId}/before-claim-instructions`,
        });
    }

    // NOT: kargo şirketi listesi ve iade talebi oluşturma uçları OrderTracking
    // controller'ında yok; açıldığında buraya eklenecek.

    /** Sipariş numarası URL'de güvenle taşınsın */
    private encode(orderNo: string): string {
        return encodeURIComponent(orderNo.trim());
    }
}

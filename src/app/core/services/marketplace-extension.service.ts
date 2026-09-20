import { inject } from '@angular/core';
import { HttpClientService } from '@/app/core/services/http-client.service';
import { AuthStateService } from '@/app/core/services/auth-state.service';
import { ApiResponse } from '@/app/core/models/api-response.model';
import { ExtensionRequest } from '@/app/core/models/marketplace/marketplace.models';

/**
 * ExtensionController pazaryeri servislerinin ortak tabanı.
 * İstek zarfındaki companyId AuthStateService'den okunur (formlarda tutulmaz).
 */
export abstract class MarketplaceExtensionService {
    protected http = inject(HttpClientService);
    protected authStateService = inject(AuthStateService);

    /** Sağlayıcı ön eki: 'trendyol', 'ikas', 'hepsiburada' ... */
    protected abstract provider: string;

    /** `{baseUrl}/Extension/{provider}/{action}` adresine istek gönderir */
    protected send<TResponse, TPayload>(action: string, payload: TPayload): Promise<ApiResponse<TResponse>> {
        const body: ExtensionRequest<TPayload> = {
            companyId: this.authStateService.profile?.companyId || '',
            payload,
        };
        return this.http.post<TResponse>({ controller: 'Extension', action: `${this.provider}/${action}` }, body);
    }

    /** Payload almayan uç noktalar için: gövdede sadece companyId gider */
    protected sendWithoutPayload<TResponse>(action: string): Promise<ApiResponse<TResponse>> {
        const body = { companyId: this.authStateService.profile?.companyId || '' };
        return this.http.post<TResponse>({ controller: 'Extension', action: `${this.provider}/${action}` }, body);
    }
}

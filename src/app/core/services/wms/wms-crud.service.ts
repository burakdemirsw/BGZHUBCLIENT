import { inject, Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { AuthStateService } from '../auth-state.service';
import { ApiResponse } from '../../models/api-response.model';
import {
    DEFAULT_PAGINATION,
    PagedResult,
    PaginationRequest,
} from '../../models/pagination.model';

/** Tüm /api/wms/* çağrılarının controller segmenti */
const WMS_CONTROLLER = 'wms';

/**
 * Seçim listeleri (dropdown) için tek seferde çekilen kayıt sayısı.
 * Sayfalı uçlardan tam liste alınamadığı için lookup'lar tek büyük sayfa ister.
 */
export const WMS_LOOKUP_PAGE_SIZE = 500;

/**
 * Tüm WMS servislerinin ortak temeli: URL üretimi, oturumdaki şirket ve
 * sayfalı istek gövdesi. Ayrıca bazı kaynakların sunduğu zenginleştirilmiş
 * görünüm uçlarını (`{resource}/list`, `{resource}/{id}/details`) karşılar.
 */
@Injectable()
export abstract class WmsResourceService {
    protected readonly http = inject(HttpClientService);
    protected readonly authState = inject(AuthStateService);

    /** Kaynak yolu — ör. 'warehouses', 'item-types' */
    protected abstract readonly resource: string;

    /** Oturumdaki şirket kimliği (forma girmez, servis katmanında eklenir) */
    protected get companyId(): string {
        return this.authState.profile?.companyId ?? '';
    }

    protected action(suffix = ''): { controller: string; action: string } {
        return {
            controller: WMS_CONTROLLER,
            action: suffix ? `${this.resource}/${suffix}` : this.resource,
        };
    }

    /**
     * Sayfalı istek gövdesi. `companyId` oturumdan doldurulur; şirketten
     * bağımsız kaynaklarda da istek şeması bu alanı zorunlu tuttuğu için gönderilir.
     */
    protected pagedBody<TRequest extends Partial<PaginationRequest>>(
        request?: TRequest,
    ): TRequest & PaginationRequest {
        return {
            ...DEFAULT_PAGINATION,
            ...request,
            companyId: request?.companyId || this.companyId,
        } as TRequest & PaginationRequest;
    }

    /** `POST {resource}/list` — filtreli, açıklamalarla zenginleştirilmiş liste */
    protected async postListView<TItem>(request: Partial<PaginationRequest>): Promise<PagedResult<TItem>> {
        const response = await this.http.post<PagedResult<TItem>>(this.action('list'), this.pagedBody(request));
        return PagedResult.from<TItem>(response);
    }

    /** `GET {resource}/{id}/details` — kaydın tüm alt tablolarıyla birlikte detayı */
    protected async getDetailView<TDetail>(id: string): Promise<TDetail | null> {
        const response = await this.http.get<TDetail>(this.action(`${id}/details`));
        return response.data;
    }
}

/**
 * WMS kaynaklarının tamamı aynı beş uçlu kalıbı kullanır:
 *   POST {resource}/paged        → sayfalı liste (PaginationRequest → PagedResult)
 *   GET  {resource}/{id}         → tekil kayıt
 *   POST {resource}              → oluştur
 *   POST {resource}/update/{id}  → güncelle
 *   POST {resource}/delete/{id}  → sil
 *
 * Bu temel sınıf kalıbı tek yerde çözer; her kaynak servisi yalnızca
 * `resource` alanını ve gerekiyorsa ek uçlarını tanımlar.
 */
@Injectable()
export abstract class WmsCrudServiceBase<
    TResponse,
    TCreate extends object,
    TUpdate extends object,
> extends WmsResourceService {

    async getPaged(request?: Partial<PaginationRequest>): Promise<PagedResult<TResponse>> {
        const response = await this.http.post<PagedResult<TResponse>>(this.action('paged'), this.pagedBody(request));
        return PagedResult.from<TResponse>(response);
    }

    /** Seçim listeleri için tek sayfada olabildiğince çok kayıt getirir */
    async getLookupItems(searchTerm?: string): Promise<TResponse[]> {
        const page = await this.getPaged({ pageSize: WMS_LOOKUP_PAGE_SIZE, searchTerm });
        return page.items;
    }

    getById(id: string): Promise<ApiResponse<TResponse>> {
        return this.http.get<TResponse>(this.action(id));
    }

    create(request: TCreate): Promise<ApiResponse<TResponse>> {
        return this.http.post<TResponse>(this.action(), request);
    }

    update(id: string, request: TUpdate): Promise<ApiResponse<object>> {
        return this.http.post<object>(this.action(`update/${id}`), request);
    }

    delete(id: string): Promise<ApiResponse<object>> {
        return this.http.post<object>(this.action(`delete/${id}`), {});
    }
}

/**
 * Şirket bazlı WMS kaynakları — oluşturma isteğine `companyId` otomatik eklenir,
 * böylece form modelinde ve şablonda bu alan bulunmaz.
 */
@Injectable()
export abstract class WmsCompanyCrudService<
    TResponse,
    TCreate extends object,
    TUpdate extends object,
> extends WmsCrudServiceBase<TResponse, TCreate, TUpdate> {

    override create(request: TCreate): Promise<ApiResponse<TResponse>> {
        return this.http.post<TResponse>(this.action(), { ...request, companyId: this.companyId });
    }
}

/**
 * Şirketten bağımsız (global) WMS kaynakları — ör. depo tipleri, ülkeler.
 * Oluşturma isteği `companyId` taşımaz.
 */
@Injectable()
export abstract class WmsGlobalCrudService<
    TResponse,
    TCreate extends object,
    TUpdate extends object,
> extends WmsCrudServiceBase<TResponse, TCreate, TUpdate> {
}

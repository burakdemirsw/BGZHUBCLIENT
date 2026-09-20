import { inject, Injectable } from '@angular/core';
import { HttpClientService } from '../http-client.service';
import { AuthStateService } from '../auth-state.service';
import { ApiResponse } from '../../models/api-response.model';

/** Tüm /api/wms/* çağrılarının controller segmenti */
const WMS_CONTROLLER = 'wms';

/**
 * WMS kaynaklarının tamamı aynı beş uçlu kalıbı kullanır:
 *   GET  {resource}/by-company/{companyId}   → liste (şirket bazlı kaynaklarda)
 *   GET  {resource}                          → liste (global kaynaklarda)
 *   GET  {resource}/{id}                     → tekil kayıt
 *   POST {resource}                          → oluştur
 *   POST {resource}/update/{id}              → güncelle
 *   POST {resource}/delete/{id}              → sil
 *
 * Bu temel sınıf kalıbı tek yerde çözer; her kaynak servisi yalnızca
 * `resource` alanını ve gerekiyorsa ek uçlarını tanımlar.
 */
@Injectable()
export abstract class WmsCrudServiceBase<TResponse, TCreate extends object, TUpdate extends object> {
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
 * Şirket bazlı WMS kaynakları — listeleme `by-company/{companyId}` ile yapılır
 * ve oluşturma isteğine `companyId` otomatik eklenir.
 */
@Injectable()
export abstract class WmsCompanyCrudService<
    TResponse,
    TCreate extends object,
    TUpdate extends object,
> extends WmsCrudServiceBase<TResponse, TCreate, TUpdate> {

    getAll(companyId?: string): Promise<ApiResponse<TResponse[]>> {
        return this.http.get<TResponse[]>(this.action(`by-company/${companyId ?? this.companyId}`));
    }

    /** companyId oturumdan eklenir; çağıran tarafın göndermesi gerekmez */
    override create(request: TCreate): Promise<ApiResponse<TResponse>> {
        return this.http.post<TResponse>(this.action(), { ...request, companyId: this.companyId });
    }
}

/**
 * Şirketten bağımsız (global) WMS kaynakları — ör. depo tipleri, ülkeler.
 * Listeleme doğrudan kaynak kökünden yapılır.
 */
@Injectable()
export abstract class WmsGlobalCrudService<
    TResponse,
    TCreate extends object,
    TUpdate extends object,
> extends WmsCrudServiceBase<TResponse, TCreate, TUpdate> {

    getAll(): Promise<ApiResponse<TResponse[]>> {
        return this.http.get<TResponse[]>(this.action());
    }
}

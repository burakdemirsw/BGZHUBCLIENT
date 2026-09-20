import { WmsAuditFields } from './wms-common.models';

/**
 * WMS lokasyon modelleri: Ülke → Bölge → İl → İlçe hiyerarşisi.
 *
 * Dördü de şirketten bağımsızdır. Tip adları `Wms` önekiyle yazılır; proje
 * genelinde `models/address/address.models.ts` içinde aynı adlı adres
 * modelleri bulunur ve bunlar farklı kaynaklardır.
 *
 * Kaynak: v1.yaml — CountryResponse / StateResponse / CityResponse /
 * DistrictResponse ve bunların Create/Update istekleri.
 */

export interface WmsCountryResponse extends WmsAuditFields {
    id: string;
    countryCode: string | null;
    countryISOCode: string | null;
    isActive: boolean;
}

export interface CreateWmsCountryRequest {
    countryCode: string | null;
    countryISOCode: string | null;
    isActive: boolean;
}

export type UpdateWmsCountryRequest = CreateWmsCountryRequest;

/** Bölge — bağlı olduğu ülkeyi `countryCode` ile taşır */
export interface WmsStateResponse extends WmsAuditFields {
    id: string;
    stateCode: string | null;
    countryCode: string | null;
    isActive: boolean;
}

export interface CreateWmsStateRequest {
    stateCode: string | null;
    countryCode: string | null;
    isActive: boolean;
}

export type UpdateWmsStateRequest = CreateWmsStateRequest;

/** İl — bağlı olduğu bölgeyi `stateCode` ile taşır */
export interface WmsCityResponse extends WmsAuditFields {
    id: string;
    cityCode: string | null;
    stateCode: string | null;
    isActive: boolean;
}

export interface CreateWmsCityRequest {
    cityCode: string | null;
    stateCode: string | null;
    isActive: boolean;
}

export type UpdateWmsCityRequest = CreateWmsCityRequest;

/** İlçe — bağlı olduğu ili `cityCode` ile taşır */
export interface WmsDistrictResponse extends WmsAuditFields {
    id: string;
    districtCode: string | null;
    cityCode: string | null;
    isActive: boolean;
}

export interface CreateWmsDistrictRequest {
    districtCode: string | null;
    cityCode: string | null;
    isActive: boolean;
}

export type UpdateWmsDistrictRequest = CreateWmsDistrictRequest;

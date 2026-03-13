export interface Country {
  id: string;
  name: string;
  code: string;
  phoneCode: string;
  isBlocked: boolean;
}

export interface CreateCountryRequest {
  name: string;
  code: string;
  phoneCode: string;
}

export interface UpdateCountryRequest {
  name: string;
  code: string;
  phoneCode: string;
  isBlocked: boolean;
}

export interface City {
  id: string;
  countryId: string;
  name: string;
  code: string;
  isBlocked: boolean;
}

export interface CreateCityRequest {
  countryId: string;
  name: string;
  code: string;
}

export interface UpdateCityRequest {
  countryId: string;
  name: string;
  code: string;
  isBlocked: boolean;
}

export interface District {
  id: string;
  cityId: string;
  name: string;
  isBlocked: boolean;
}

export interface CreateDistrictRequest {
  cityId: string;
  name: string;
}

export interface UpdateDistrictRequest {
  cityId: string;
  name: string;
  isBlocked: boolean;
}

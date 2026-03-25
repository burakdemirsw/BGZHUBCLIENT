export interface Company {
  id: string;
  name: string;
  taxNumber?: string;
  taxOffice?: string;
  tradeRegisterNo?: string;
  mersisNo?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  countryId?: string;
  countryName?: string;
  cityId?: string;
  cityName?: string;
  districtId?: string;
  districtName?: string;
  address?: string;
  postalCode?: string;
  isBlocked: boolean;
  createdDate: string;
  updatedDate: string;
}

export interface CreateCompanyRequest {
  name: string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  tradeRegisterNo?: string | null;
  mersisNo?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  countryId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  address?: string | null;
  postalCode?: string | null;
}

export interface UpdateCompanyRequest {
  name: string;
  taxNumber?: string | null;
  taxOffice?: string | null;
  tradeRegisterNo?: string | null;
  mersisNo?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  countryId?: string | null;
  cityId?: string | null;
  districtId?: string | null;
  address?: string | null;
  postalCode?: string | null;
  isBlocked: boolean;
}

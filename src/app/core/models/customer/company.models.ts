export interface Company {
  id: string;
  name?: string;
  taxNumber?: string;
  taxOffice?: string;
  tradeRegisterNo?: string;
  mersisNo?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  countryId?: string;
  cityId?: string;
  districtId?: string;
  address?: string;
  postalCode?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  countryName?: string;
  cityName?: string;
  districtName?: string;
}

export interface CreateCompanyRequest {
  name: string;
  taxNumber: string;
  taxOffice: string;
  tradeRegisterNo: string;
  mersisNo: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  countryId: string;
  cityId: string;
  districtId: string;
  address: string;
  postalCode: string;
}

export interface UpdateCompanyRequest {
  name: string;
  taxNumber: string;
  taxOffice: string;
  tradeRegisterNo: string;
  mersisNo: string;
  phone: string;
  email: string;
  website: string;
  logoUrl: string;
  countryId: string;
  cityId: string;
  districtId: string;
  address: string;
  postalCode: string;
  isBlocked: boolean;
}

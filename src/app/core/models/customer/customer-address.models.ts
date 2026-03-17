export interface CustomerAddress {
  id: string;
  customerId?: string;
  addressTypeId?: string;
  countryId?: string;
  cityId?: string;
  districtId?: string;
  addressLine?: string;
  postalCode?: string;
  isDefault?: boolean;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
  // Expanded
  customerName?: string;
  addressTypeName?: string;
  countryName?: string;
  cityName?: string;
  districtName?: string;
}

export interface CreateCustomerAddressRequest {
  customerId: string;
  addressTypeId: string;
  countryId: string;
  cityId: string;
  districtId: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
}

export interface UpdateCustomerAddressRequest {
  customerId: string;
  addressTypeId: string;
  countryId: string;
  cityId: string;
  districtId: string;
  addressLine: string;
  postalCode: string;
  isDefault: boolean;
  isBlocked: boolean;
}

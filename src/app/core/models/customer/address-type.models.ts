export interface AddressType {
  id: string;
  name?: string;
  description?: string;
  isBlocked?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export interface CreateAddressTypeRequest {
  name: string;
  description: string;
}

export interface UpdateAddressTypeRequest {
  name: string;
  description: string;
  isBlocked: boolean;
}

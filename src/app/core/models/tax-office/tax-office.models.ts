export interface TaxOfficeResponse {
    id: string;
    taxOfficeDescription?: string;
    isBlocked: boolean;
    createdDate: string;
    updatedDate: string;
}

export interface CreateTaxOfficeRequest {
    taxOfficeDescription: string;
}

export interface UpdateTaxOfficeRequest {
    taxOfficeDescription: string;
    isBlocked: boolean;
}
